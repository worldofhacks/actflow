/**
 * Client-side mirror of the @actflow/reputation ranking API response shapes.
 * These match the service contract exactly (services/reputation/src/types.ts):
 * every data response carries a `source: "live" | "fixture"` provenance flag so
 * the UI can be honest about whether numbers are real on-chain data or sample
 * fixtures.
 */

export type DataSource = 'live' | 'fixture';

/** Sort modes accepted by GET /leaderboard?sort=. */
export type LeaderboardSort = 'score' | 'validations' | 'recent' | 'feedback';

/** Per-agent scoring breakdown (the components behind `score`). */
export interface ScoreBreakdown {
  feedbackCount: number;
  revokedCount: number;
  averageValue: number;
  recencyWeightedValue: number;
  validationCount: number;
  averageValidationConfidence: number;
  daysSinceLastFeedback: number | null;
}

/** A fully ranked agent as returned by the reputation API. */
export interface RankedAgent {
  /** ERC-721 owner address; "" when unknown. */
  address: string;
  /** ERC-8004 tokenId / agentId. */
  erc8004Id: number;
  /** Trust score 0..100 (2dp). */
  score: number;
  breakdown: ScoreBreakdown;
  /** == breakdown.validationCount, surfaced for convenience. */
  validations: number;
  /** True when the agent's registration declares x402 payment support. */
  x402: boolean;
  /** Daily feedback counts, oldest -> newest. */
  sparkline: number[];
  source: DataSource;
  /** Registration URI when known. */
  agentUri?: string | null;
}

/** GET /leaderboard response. */
export interface LeaderboardResponse {
  source: DataSource;
  sort: LeaderboardSort;
  count: number;
  agents: RankedAgent[];
}

/** GET /agents/:address/reputation response. */
export interface AgentReputationResponse {
  source: DataSource;
  agent: RankedAgent;
}

/** GET /health response. */
export interface ReputationHealthResponse {
  ok: boolean;
  service: string;
  mode: DataSource;
  source: DataSource;
}

/**
 * Lightweight ActFlow marketplace stats, keyed by lowercased agent address.
 * Blended into each leaderboard row alongside the on-chain reputation score.
 */
export interface MarketplaceAgentStats {
  /** Lowercased 0x address (the ActFlow agentId). */
  address: string;
  name?: string;
  avatar?: string;
  topic?: string;
  tasksCompleted?: number;
  earnAmount?: string;
  successRate?: number;
  averageRating?: number;
  totalRatings?: number;
}

/**
 * A leaderboard row after blending on-chain reputation with ActFlow stats.
 * `marketplace` is null when no ActFlow agent matched the on-chain address.
 */
export interface BlendedAgent extends RankedAgent {
  marketplace: MarketplaceAgentStats | null;
}
