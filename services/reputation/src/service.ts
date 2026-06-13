/**
 * ReputationService — the importable library surface. Loads a RegistryDataset
 * (live or fixture) and exposes ranked leaderboard + single-agent detail.
 */

import { createRepository, type RegistryRepository } from './bigquery/repository.js';
import { rankAgents } from './scoring/scoring.js';
import type { ReputationConfig } from './config.js';
import type { RankedAgent, RegistryDataset } from './types.js';

export type LeaderboardSort = 'score' | 'validations' | 'recent' | 'feedback';

export interface LeaderboardOptions {
  sort?: LeaderboardSort;
  limit?: number;
  /** Inject current time for deterministic tests. */
  nowMs?: number;
}

export interface LeaderboardResult {
  source: RegistryDataset['source'];
  count: number;
  agents: RankedAgent[];
}

export interface AgentReputationResult {
  source: RegistryDataset['source'];
  agent: RankedAgent | null;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function applySort(agents: RankedAgent[], sort: LeaderboardSort): RankedAgent[] {
  const copy = [...agents];
  switch (sort) {
    case 'validations':
      copy.sort((a, b) => b.validations - a.validations || b.score - a.score);
      break;
    case 'feedback':
      copy.sort(
        (a, b) =>
          b.breakdown.feedbackCount - a.breakdown.feedbackCount || b.score - a.score
      );
      break;
    case 'recent':
      // smallest daysSinceLastFeedback first; nulls (never) last
      copy.sort((a, b) => {
        const da = a.breakdown.daysSinceLastFeedback;
        const db = b.breakdown.daysSinceLastFeedback;
        if (da === null && db === null) return b.score - a.score;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      });
      break;
    case 'score':
    default:
      copy.sort((a, b) => b.score - a.score || a.erc8004Id - b.erc8004Id);
      break;
  }
  return copy;
}

export class ReputationService {
  private readonly repo: RegistryRepository;

  constructor(
    private readonly config: ReputationConfig,
    repo?: RegistryRepository
  ) {
    this.repo = repo ?? createRepository(config);
  }

  private async rankedAll(nowMs: number): Promise<{
    source: RegistryDataset['source'];
    agents: RankedAgent[];
  }> {
    const dataset = await this.repo.load();
    const agents = rankAgents({
      registrations: dataset.registrations,
      feedback: dataset.feedback,
      revokedFeedback: dataset.revokedFeedback,
      validations: dataset.validations,
      activity: dataset.activity,
      source: dataset.source,
      nowMs,
      halfLifeDays: this.config.recencyHalfLifeDays,
      sparklineBuckets: this.config.sparklineBuckets,
    });
    return { source: dataset.source, agents };
  }

  async leaderboard(options: LeaderboardOptions = {}): Promise<LeaderboardResult> {
    const nowMs = options.nowMs ?? Date.now();
    const sort = options.sort ?? 'score';
    const limit = clampLimit(options.limit);
    const { source, agents } = await this.rankedAll(nowMs);
    const sorted = applySort(agents, sort).slice(0, limit);
    return { source, count: sorted.length, agents: sorted };
  }

  async agentReputation(
    address: string,
    nowMs: number = Date.now()
  ): Promise<AgentReputationResult> {
    const { source, agents } = await this.rankedAll(nowMs);
    const target = address.toLowerCase();
    const agent =
      agents.find(
        (a) =>
          a.address.toLowerCase() === target ||
          String(a.erc8004Id) === address
      ) ?? null;
    return { source, agent };
  }
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  const n = Math.floor(limit);
  if (n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}
