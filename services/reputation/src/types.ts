/**
 * Shared row/result shapes. Both the live BigQuery path and the fixture path
 * produce these EXACT shapes, so scoring/API code is source-agnostic and the
 * SQL is genuinely shape-tested against fixtures.
 */

export type DataSource = 'live' | 'fixture';

/** One Identity-registry `Registered` row. */
export interface RegistrationRow {
  agent_id: number;
  owner_address: string;
  block_timestamp: string; // ISO-8601 UTC
  transaction_hash: string;
  /**
   * The agent's registration URI (agentURI). Live: decoded client-side from
   * the ABI-encoded `data` string. Fixtures: provided directly. Used by the
   * scorer to derive the x402-payable flag.
   */
  agent_uri?: string | null;
}

/** One Reputation-registry `NewFeedback` row. */
export interface FeedbackRow {
  agent_id: number;
  client_address: string;
  feedback_index: number;
  /** Raw 32-byte hex word for `value` (int128); decode big/negative client-side. */
  value_hex: string;
  /** SAFE_CAST INT64 of value (valid for small positive values; see skill). */
  value_raw: number;
  value_decimals: number;
  block_timestamp: string; // ISO-8601 UTC
  transaction_hash: string;
}

/** One Reputation-registry `FeedbackRevoked` row. */
export interface RevokedFeedbackRow {
  agent_id: number;
  client_address: string;
  feedback_index: number;
  block_timestamp: string;
  transaction_hash: string;
}

/** One Validation-registry `ValidationResponse` row. */
export interface ValidationRow {
  agent_id: number;
  validator_address: string;
  request_hash: string;
  /** uint8 0-100 confidence (skill). */
  response: number;
  block_timestamp: string;
  transaction_hash: string;
}

/** One activity-over-time bucket. */
export interface ActivityRow {
  agent_id: number;
  day: string; // YYYY-MM-DD UTC
  feedback_count: number;
}

/** The full decoded dataset the repository layer returns. */
export interface RegistryDataset {
  registrations: RegistrationRow[];
  feedback: FeedbackRow[];
  revokedFeedback: RevokedFeedbackRow[];
  validations: ValidationRow[];
  activity: ActivityRow[];
  /** Where the data came from. Always surfaced on API responses. */
  source: DataSource;
}

/** Scoring breakdown attached to each ranked agent. */
export interface ScoreBreakdown {
  /** Number of non-revoked feedback entries counted. */
  feedbackCount: number;
  /** Number of revoked feedback entries excluded. */
  revokedCount: number;
  /** Mean of decoded feedback values (value/10**decimals), 0 if none. */
  averageValue: number;
  /** Recency-weighted mean of decoded feedback values. */
  recencyWeightedValue: number;
  /** Count of validation responses for the agent. */
  validationCount: number;
  /** Mean validation confidence (0-100), 0 if none. */
  averageValidationConfidence: number;
  /** Days since the most recent feedback (null if no feedback). */
  daysSinceLastFeedback: number | null;
}

/** A fully ranked agent as returned by the API. */
export interface RankedAgent {
  address: string;
  erc8004Id: number;
  score: number;
  breakdown: ScoreBreakdown;
  validations: number;
  /** True when the agent's registration URI/metadata declares x402 support. */
  x402: boolean;
  /** Activity sparkline (oldest -> newest feedback counts per day bucket). */
  sparkline: number[];
  source: DataSource;
  /** Registration URI when known (helps the frontend link out). */
  agentUri?: string | null;
}
