/**
 * REAL, parameterized BigQuery SQL over the public Ethereum dataset
 * (`bigquery-public-data.crypto_ethereum.logs`) decoding ERC-8004 registry
 * events. One query per concern: registrations, feedback, validations,
 * activity-over-time.
 *
 * All SQL is built ONLY from constants verified in the erc8004-bigquery skill
 * (table name, topic0 hashes, registry addresses, the `crypto_ethereum.logs`
 * column schema, the NewFeedback data-word offsets, and the mandatory
 * `block_timestamp >= TIMESTAMP('2026-01-29')` launch bound). The SAME query
 * strings are used live and are shape-tested against fixtures, so they work
 * the moment GCP credentials arrive.
 *
 * Decoding follows the skill exactly:
 *  - `topics` is STRING REPEATED, accessed via `topics[OFFSET(n)]`,
 *    guarded with ARRAY_LENGTH(topics).
 *  - indexed uint256 agentId  -> topics[OFFSET(1)]
 *  - indexed address          -> CONCAT('0x', SUBSTR(topic, 27))  (last 20 bytes)
 *  - NewFeedback non-indexed data word layout (1-indexed, 0x included):
 *      word0 feedbackIndex  = SUBSTR(data, 3,   64)
 *      word1 value (int128) = SUBSTR(data, 67,  64)
 *      word2 valueDecimals  = SUBSTR(data, 131, 64)
 *  - SAFE_CAST(... AS INT64) per the skill's Minimal Working Example. The
 *    skill warns int128 `value` can overflow/needs two's-complement decoding
 *    for large/negative values; callers re-decode big/negative raw values
 *    client-side (we expose the raw hex word too so nothing is lost).
 */

import {
  BQ,
  MAINNET_LAUNCH_TIMESTAMP,
  MAINNET_REGISTRIES_LC,
  TOPIC0,
} from './registry.js';

/** Named bind-parameter sets passed to BigQuery `query({ params })`. */
export interface QueryParams {
  [key: string]: string | number | null;
}

export interface NamedQuery {
  /** Human label for the concern this query answers. */
  readonly name: string;
  /** The parameterized SQL string (identical live and in shape tests). */
  readonly sql: string;
  /** Bound parameters (registry address, topic0, launch ts, limit). */
  readonly params: QueryParams;
}

const T = `\`${BQ.logsTable}\``;
const LAUNCH = `TIMESTAMP('${MAINNET_LAUNCH_TIMESTAMP}')`;

/**
 * Concern 1 — REGISTRATIONS.
 * Identity registry `Registered(uint256 agentId*, string agentURI, address owner*)`.
 * agentId is indexed (topics[1]); owner is indexed (topics[2], last 20 bytes).
 * agentURI lives in non-indexed `data` as an ABI-encoded string (offset +
 * length + bytes); we return the raw `data` so the agentURI is decoded
 * client-side (variable-length strings cannot be sliced by fixed offset).
 */
export function registrationsQuery(limit = 500): NamedQuery {
  const sql = `
    SELECT
      block_timestamp,
      block_number,
      transaction_hash,
      log_index,
      SAFE_CAST(topics[OFFSET(1)] AS INT64)          AS agent_id,      -- indexed uint256 agentId
      CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27))    AS owner_address, -- indexed address (last 20 bytes)
      data                                            AS data          -- ABI-encoded agentURI string; decode client-side
    FROM ${T}
    WHERE address = @registry
      AND ARRAY_LENGTH(topics) >= 3
      AND topics[OFFSET(0)] = @topic0
      AND block_timestamp >= ${LAUNCH}
    ORDER BY block_timestamp DESC
    LIMIT @limit`;
  return {
    name: 'registrations',
    sql,
    params: {
      registry: MAINNET_REGISTRIES_LC.identity,
      topic0: TOPIC0.Registered,
      limit,
    },
  };
}

/**
 * Concern 2 — FEEDBACK (reputation entries).
 * Reputation registry `NewFeedback(...)`. Decodes agentId, client address and
 * the first three non-indexed data words (feedbackIndex, value, valueDecimals)
 * exactly per the skill Minimal Working Example. Real score =
 * value_raw / 10**value_decimals (re-decode big/negative `value` via viem).
 * Aggregations must subtract FeedbackRevoked (see revokedFeedbackQuery).
 */
export function feedbackQuery(limit = 1000): NamedQuery {
  const sql = `
    SELECT
      block_timestamp,
      block_number,
      transaction_hash,
      log_index,
      SAFE_CAST(topics[OFFSET(1)] AS INT64)                   AS agent_id,        -- indexed uint256 agentId
      CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27))             AS client_address,  -- indexed address
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 3, 64))   AS INT64) AS feedback_index,  -- data word0
      CONCAT('0x', SUBSTR(data, 67, 64))                      AS value_hex,       -- data word1 raw (int128; decode client-side)
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 67, 64))  AS INT64) AS value_raw,       -- data word1 (overflows >2^63-1; see skill Gotchas)
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 131, 64)) AS INT64) AS value_decimals   -- data word2
    FROM ${T}
    WHERE address = @registry
      AND ARRAY_LENGTH(topics) >= 3
      AND topics[OFFSET(0)] = @topic0
      AND block_timestamp >= ${LAUNCH}
    ORDER BY block_timestamp DESC
    LIMIT @limit`;
  return {
    name: 'feedback',
    sql,
    params: {
      registry: MAINNET_REGISTRIES_LC.reputation,
      topic0: TOPIC0.NewFeedback,
      limit,
    },
  };
}

/**
 * Concern 2b — REVOKED FEEDBACK.
 * `FeedbackRevoked(uint256 agentId*, address clientAddress*, uint64 feedbackIndex*)`.
 * All three params are indexed, so feedbackIndex comes from topics[3].
 * Subtract these from feedback aggregates (skill Gotchas).
 */
export function revokedFeedbackQuery(limit = 1000): NamedQuery {
  const sql = `
    SELECT
      block_timestamp,
      transaction_hash,
      log_index,
      SAFE_CAST(topics[OFFSET(1)] AS INT64)        AS agent_id,        -- indexed uint256 agentId
      CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27))  AS client_address,  -- indexed address
      SAFE_CAST(topics[OFFSET(3)] AS INT64)        AS feedback_index   -- indexed uint64
    FROM ${T}
    WHERE address = @registry
      AND ARRAY_LENGTH(topics) >= 4
      AND topics[OFFSET(0)] = @topic0
      AND block_timestamp >= ${LAUNCH}
    ORDER BY block_timestamp DESC
    LIMIT @limit`;
  return {
    name: 'revokedFeedback',
    sql,
    params: {
      registry: MAINNET_REGISTRIES_LC.reputation,
      topic0: TOPIC0.FeedbackRevoked,
      limit,
    },
  };
}

/**
 * Concern 3 — VALIDATIONS.
 * `ValidationResponse(address validatorAddress*, uint256 agentId*, bytes32 requestHash*,
 *   uint8 response, string responseURI, bytes32 responseHash, string tag)`.
 * Indexed: validatorAddress (topics[1]), agentId (topics[2]), requestHash
 * (topics[3]). The non-indexed `data` begins with `response` (uint8, padded to
 * 32 bytes) as word0. The skill: ValidationRegistry mainnet traffic may be
 * near zero — handle empty result sets.
 */
export function validationsQuery(limit = 1000): NamedQuery {
  const sql = `
    SELECT
      block_timestamp,
      block_number,
      transaction_hash,
      log_index,
      CONCAT('0x', SUBSTR(topics[OFFSET(1)], 27))           AS validator_address, -- indexed address
      SAFE_CAST(topics[OFFSET(2)] AS INT64)                 AS agent_id,          -- indexed uint256 agentId
      topics[OFFSET(3)]                                     AS request_hash,      -- indexed bytes32
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 3, 64)) AS INT64) AS response           -- data word0: uint8 0-100 confidence
    FROM ${T}
    WHERE address = @registry
      AND ARRAY_LENGTH(topics) >= 4
      AND topics[OFFSET(0)] = @topic0
      AND block_timestamp >= ${LAUNCH}
    ORDER BY block_timestamp DESC
    LIMIT @limit`;
  return {
    name: 'validations',
    sql,
    params: {
      registry: MAINNET_REGISTRIES_LC.validation,
      topic0: TOPIC0.ValidationResponse,
      limit,
    },
  };
}

/**
 * Concern 4 — ACTIVITY OVER TIME.
 * Daily counts of NewFeedback per agent across the reputation registry,
 * used to build the sparkline series. Buckets by UTC day.
 */
export function activityOverTimeQuery(limit = 5000): NamedQuery {
  const sql = `
    SELECT
      SAFE_CAST(topics[OFFSET(1)] AS INT64)        AS agent_id,   -- indexed uint256 agentId
      DATE(block_timestamp)                        AS day,
      COUNT(*)                                      AS feedback_count
    FROM ${T}
    WHERE address = @registry
      AND ARRAY_LENGTH(topics) >= 2
      AND topics[OFFSET(0)] = @topic0
      AND block_timestamp >= ${LAUNCH}
    GROUP BY agent_id, day
    ORDER BY day DESC
    LIMIT @limit`;
  return {
    name: 'activityOverTime',
    sql,
    params: {
      registry: MAINNET_REGISTRIES_LC.reputation,
      topic0: TOPIC0.NewFeedback,
      limit,
    },
  };
}

/** All concern queries, for shape-testing and batch execution. */
export function allQueries(): NamedQuery[] {
  return [
    registrationsQuery(),
    feedbackQuery(),
    revokedFeedbackQuery(),
    validationsQuery(),
    activityOverTimeQuery(),
  ];
}
