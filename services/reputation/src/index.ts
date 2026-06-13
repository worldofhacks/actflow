/**
 * @actflow/reputation — public library surface.
 *
 * Ranks ERC-8004 agents by on-chain reputation/validation activity read from
 * Google BigQuery (live, when GCP creds are present) or committed fixtures
 * (default). All responses carry source:'live'|'fixture'.
 */

export { loadConfig, type ReputationConfig } from './config.js';
export {
  ReputationService,
  type LeaderboardOptions,
  type LeaderboardResult,
  type LeaderboardSort,
  type AgentReputationResult,
} from './service.js';
export { buildApp, type BuildAppOptions } from './api/app.js';

export {
  createRepository,
  FixtureRepository,
  LiveRepository,
  type RegistryRepository,
} from './bigquery/repository.js';
export { BigQueryClient } from './bigquery/client.js';
export {
  registrationsQuery,
  feedbackQuery,
  revokedFeedbackQuery,
  validationsQuery,
  activityOverTimeQuery,
  allQueries,
  type NamedQuery,
} from './bigquery/queries.js';
export {
  MAINNET_REGISTRIES,
  MAINNET_REGISTRIES_LC,
  TOPIC0,
  EVENT_SIGNATURES,
  BQ,
  MAINNET_LAUNCH_TIMESTAMP,
  ETHEREUM_MAINNET_CHAIN_ID,
  agentIdToTopic,
} from './bigquery/registry.js';

export {
  rankAgents,
  computeBreakdown,
  compositeScore,
  decodeFeedbackValue,
  recencyWeight,
  deriveX402,
  buildSparkline,
} from './scoring/scoring.js';

export { loadFixtureDataset } from './fixtures/index.js';

export type {
  DataSource,
  RegistrationRow,
  FeedbackRow,
  RevokedFeedbackRow,
  ValidationRow,
  ActivityRow,
  RegistryDataset,
  ScoreBreakdown,
  RankedAgent,
} from './types.js';
