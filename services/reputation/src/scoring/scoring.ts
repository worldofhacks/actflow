/**
 * Scoring — pure, deterministic functions. No I/O, no clock reads except the
 * `now` argument the caller passes (so tests are fully reproducible).
 *
 * Reputation semantics follow the erc8004-bigquery skill:
 *  - decoded feedback value = value_raw / 10**value_decimals (signed fixed-pt).
 *  - revoked feedback (FeedbackRevoked) is subtracted before scoring.
 *  - validation `response` is a 0-100 confidence.
 *  - x402 support is declared via the agent's registration URI / metadata.
 */

import type {
  ActivityRow,
  FeedbackRow,
  RankedAgent,
  RegistrationRow,
  RevokedFeedbackRow,
  ScoreBreakdown,
  ValidationRow,
  DataSource,
} from '../types.js';

const MS_PER_DAY = 86_400_000;

/** Decode one feedback row's value to a real number (value/10**decimals). */
export function decodeFeedbackValue(row: Pick<FeedbackRow, 'value_raw' | 'value_decimals'>): number {
  const decimals = Number.isFinite(row.value_decimals) ? row.value_decimals : 0;
  const divisor = 10 ** Math.max(0, decimals);
  return divisor === 0 ? row.value_raw : row.value_raw / divisor;
}

/**
 * Exponential recency weight in (0, 1]. weight = 0.5 ** (ageDays / halfLife).
 * A feedback exactly `halfLife` days old counts half as much as a brand-new
 * one; today's feedback weighs ~1.0.
 */
export function recencyWeight(
  timestampMs: number,
  nowMs: number,
  halfLifeDays: number
): number {
  if (halfLifeDays <= 0) return 1;
  const ageDays = Math.max(0, (nowMs - timestampMs) / MS_PER_DAY);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/** Build the set of revoked feedback keys (agent_id:client:index). */
function revokedKeySet(revoked: RevokedFeedbackRow[]): Set<string> {
  const set = new Set<string>();
  for (const r of revoked) {
    set.add(`${r.agent_id}:${r.client_address.toLowerCase()}:${r.feedback_index}`);
  }
  return set;
}

function feedbackKey(r: FeedbackRow): string {
  return `${r.agent_id}:${r.client_address.toLowerCase()}:${r.feedback_index}`;
}

/**
 * Detect x402 payment support from an agent's registration URI / metadata.
 * The skill: agentURI registration JSON lists "x402 payment support". We do a
 * conservative substring match on the URI (and any provided metadata strings)
 * for the token "x402". Returns false when the URI is unknown.
 */
export function deriveX402(
  registration: Pick<RegistrationRow, 'agent_uri'> | undefined,
  extraMetadata: string[] = []
): boolean {
  const haystacks: string[] = [];
  if (registration?.agent_uri) haystacks.push(registration.agent_uri);
  haystacks.push(...extraMetadata);
  return haystacks.some((h) => typeof h === 'string' && h.toLowerCase().includes('x402'));
}

/**
 * Build a fixed-length sparkline (oldest -> newest) of per-day feedback counts
 * for one agent over the last `buckets` days ending at `nowMs`.
 */
export function buildSparkline(
  activity: ActivityRow[],
  agentId: number,
  nowMs: number,
  buckets: number
): number[] {
  const series = new Array<number>(Math.max(0, buckets)).fill(0);
  if (buckets <= 0) return series;
  // Index 0 = oldest day, index buckets-1 = today (UTC day of nowMs).
  const todayUtc = Math.floor(nowMs / MS_PER_DAY);
  for (const a of activity) {
    if (a.agent_id !== agentId) continue;
    const dayMs = Date.parse(`${a.day}T00:00:00Z`);
    if (Number.isNaN(dayMs)) continue;
    const dayIdx = Math.floor(dayMs / MS_PER_DAY);
    const offsetFromToday = todayUtc - dayIdx; // 0 = today, 1 = yesterday...
    const slot = buckets - 1 - offsetFromToday;
    if (slot >= 0 && slot < buckets) {
      series[slot] += a.feedback_count;
    }
  }
  return series;
}

export interface ScoringInputs {
  feedback: FeedbackRow[];
  revokedFeedback: RevokedFeedbackRow[];
  validations: ValidationRow[];
  /** Current time in epoch ms (injected for determinism). */
  nowMs: number;
  halfLifeDays: number;
}

/**
 * Compute the score breakdown for ONE agent from its already-filtered rows.
 * Returns zeros for an agent with no (non-revoked) feedback.
 */
export function computeBreakdown(inputs: ScoringInputs): ScoreBreakdown {
  const { feedback, revokedFeedback, validations, nowMs, halfLifeDays } = inputs;
  const revoked = revokedKeySet(revokedFeedback);

  const live = feedback.filter((f) => !revoked.has(feedbackKey(f)));
  const revokedCount = feedback.length - live.length;

  let sum = 0;
  let weightedSum = 0;
  let weightTotal = 0;
  let mostRecentMs: number | null = null;

  for (const f of live) {
    const value = decodeFeedbackValue(f);
    const tMs = Date.parse(f.block_timestamp);
    const w = Number.isNaN(tMs) ? 0 : recencyWeight(tMs, nowMs, halfLifeDays);
    sum += value;
    weightedSum += value * w;
    weightTotal += w;
    if (!Number.isNaN(tMs)) {
      mostRecentMs = mostRecentMs === null ? tMs : Math.max(mostRecentMs, tMs);
    }
  }

  const feedbackCount = live.length;
  const averageValue = feedbackCount > 0 ? sum / feedbackCount : 0;
  const recencyWeightedValue = weightTotal > 0 ? weightedSum / weightTotal : 0;

  const validationCount = validations.length;
  const averageValidationConfidence =
    validationCount > 0
      ? validations.reduce((acc, v) => acc + v.response, 0) / validationCount
      : 0;

  const daysSinceLastFeedback =
    mostRecentMs === null ? null : Math.max(0, (nowMs - mostRecentMs) / MS_PER_DAY);

  return {
    feedbackCount,
    revokedCount,
    averageValue,
    recencyWeightedValue,
    validationCount,
    averageValidationConfidence,
    daysSinceLastFeedback,
  };
}

/**
 * Collapse a breakdown into a single 0-100 score.
 *
 * Composition (documented so the frontend can show "how it's computed"):
 *  - reputation component (70%): recency-weighted mean value mapped to 0-100,
 *    assuming the 5.0-star convention (value in [0,5]); clamped.
 *  - validation component (20%): mean validation confidence (already 0-100).
 *  - engagement component (10%): saturating count of non-revoked feedback,
 *    reaching full marks at >= 10 entries.
 * Agents with no feedback AND no validations score 0.
 */
export function compositeScore(b: ScoreBreakdown): number {
  if (b.feedbackCount === 0 && b.validationCount === 0) return 0;

  const reputation = clamp((b.recencyWeightedValue / 5) * 100, 0, 100);
  const validation = clamp(b.averageValidationConfidence, 0, 100);
  const engagement = clamp((b.feedbackCount / 10) * 100, 0, 100);

  const score = reputation * 0.7 + validation * 0.2 + engagement * 0.1;
  return round2(clamp(score, 0, 100));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface RankInputs {
  registrations: RegistrationRow[];
  feedback: FeedbackRow[];
  revokedFeedback: RevokedFeedbackRow[];
  validations: ValidationRow[];
  activity: ActivityRow[];
  source: DataSource;
  nowMs: number;
  halfLifeDays: number;
  sparklineBuckets: number;
}

/**
 * Rank ALL agents present in the dataset. An agent is any agent_id that appears
 * in registrations OR feedback OR validations. Returns one RankedAgent each,
 * sorted by score desc (stable tiebreak on erc8004Id asc).
 */
export function rankAgents(inputs: RankInputs): RankedAgent[] {
  const {
    registrations,
    feedback,
    revokedFeedback,
    validations,
    activity,
    source,
    nowMs,
    halfLifeDays,
    sparklineBuckets,
  } = inputs;

  const regByAgent = new Map<number, RegistrationRow>();
  for (const r of registrations) {
    // keep the earliest registration per agent (first owner)
    if (!regByAgent.has(r.agent_id)) regByAgent.set(r.agent_id, r);
  }

  const agentIds = new Set<number>();
  for (const r of registrations) agentIds.add(r.agent_id);
  for (const f of feedback) agentIds.add(f.agent_id);
  for (const v of validations) agentIds.add(v.agent_id);

  const ranked: RankedAgent[] = [];
  for (const agentId of agentIds) {
    const reg = regByAgent.get(agentId);
    const agentFeedback = feedback.filter((f) => f.agent_id === agentId);
    const agentRevoked = revokedFeedback.filter((r) => r.agent_id === agentId);
    const agentValidations = validations.filter((v) => v.agent_id === agentId);

    const breakdown = computeBreakdown({
      feedback: agentFeedback,
      revokedFeedback: agentRevoked,
      validations: agentValidations,
      nowMs,
      halfLifeDays,
    });

    ranked.push({
      address: reg?.owner_address ?? '',
      erc8004Id: agentId,
      score: compositeScore(breakdown),
      breakdown,
      validations: breakdown.validationCount,
      x402: deriveX402(reg),
      sparkline: buildSparkline(activity, agentId, nowMs, sparklineBuckets),
      source,
      agentUri: reg?.agent_uri ?? null,
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.erc8004Id - b.erc8004Id);
  return ranked;
}
