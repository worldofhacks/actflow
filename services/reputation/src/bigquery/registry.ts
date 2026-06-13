/**
 * ERC-8004 registry constants — VERBATIM from
 *   /home/actlabs/actflow/.claude/skills/erc8004-bigquery/SKILL.md
 *
 * Every address, topic0, dataset id and event signature below is copied
 * directly from that skill (which was verified against the official
 * erc-8004/erc-8004-contracts repo + Google BigQuery docs and checked
 * on-chain). DO NOT invent or edit these values. Anything the skill marks
 * "NOT FOUND IN DOCS" / unverified is flagged TODO/UNVERIFIED here and is
 * NOT used to build a live query path.
 *
 * BigQuery `crypto_ethereum.logs` stores addresses/topics as LOWERCASE hex,
 * so the values exposed for query filtering are pre-lowercased (per the
 * skill "Gotchas": "Addresses/topics there are lowercase hex — lowercase
 * your filters.").
 */

/** Ethereum mainnet chainId (skill: "Chain IDs ... Ethereum `1`"). */
export const ETHEREUM_MAINNET_CHAIN_ID = 1 as const;

/**
 * Mainnet registry proxy addresses ("MinimalUUPSMainnet v1.0.0"), verbatim
 * from the skill "Addresses & Chain Config" section. Checksummed form kept
 * for display/on-chain use; query filters must use the lowercased form.
 */
export const MAINNET_REGISTRIES = {
  identity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  reputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
  validation: '0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58',
} as const;

/** Lowercased mainnet registry addresses for BigQuery `logs.address` filters. */
export const MAINNET_REGISTRIES_LC = {
  identity: MAINNET_REGISTRIES.identity.toLowerCase(),
  reputation: MAINNET_REGISTRIES.reputation.toLowerCase(),
  validation: MAINNET_REGISTRIES.validation.toLowerCase(),
} as const;

/**
 * Event topic0 hashes (keccak256 of the event signature), verbatim from the
 * skill "Events you will filter on" table. Already lowercase as published.
 */
export const TOPIC0 = {
  Registered:
    '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a',
  URIUpdated:
    '0x3a2c7fffc2cba7582c690e3b82c453ea02a308326a98a3ad7576c606336409fb',
  MetadataSet:
    '0x2c149ed548c6d2993cd73efe187df6eccabe4538091b33adbd25fafdb8a1468b',
  Transfer:
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  NewFeedback:
    '0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc',
  FeedbackRevoked:
    '0x25156fd3288212246d8b008d5921fde376c71ed14ac2e072a506eb06fde6d09d',
  ResponseAppended:
    '0xb1c6be0b5b8aef6539e2fac0fd131a2faa7b49edf8e505b5eb0ad487d56051d4',
  ValidationRequest:
    '0x530436c3634a98e1e626b0898be2f1e9980cc1bd2a78c07a0aba52d0a48a5059',
  ValidationResponse:
    '0xafddf629e874ccc3963b6a888c477bd464a6c8525024fc88759ea3b2326349ae',
  Upgraded:
    '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
} as const;

/**
 * Full type-only event signatures, verbatim from the skill "Events you will
 * filter on" table. Used for the Google-managed `decoded_events` dataset
 * (event_signature column) — see the skill "Alternative without manual
 * decoding" example.
 */
export const EVENT_SIGNATURES = {
  NewFeedback:
    'NewFeedback(uint256,address,uint64,int128,uint8,string,string,string,string,string,bytes32)',
  ValidationResponse:
    'ValidationResponse(address,uint256,bytes32,uint8,string,string,bytes32,string)',
  Registered: 'Registered(uint256,string,address)',
} as const;

/**
 * BigQuery dataset / table identifiers, verbatim from the skill "BigQuery
 * datasets / tables" section.
 *
 * The skill documents the community Ethereum-ETL `crypto_ethereum.logs`
 * table as "simplest for logs" and gives a full, verified column schema +
 * the data-word offsets needed to decode NewFeedback — so all live queries
 * here target that table.
 */
export const BQ = {
  /** Primary table used for all live queries (skill: "simplest for logs"). */
  logsTable: 'bigquery-public-data.crypto_ethereum.logs',
  /**
   * Google-managed decoded dataset. The skill notes BOTH ids appear in
   * official docs and "if one 404s in your console, use the other". Kept for
   * reference; the per-event `args` index order is "NOT FOUND IN DOCS" per
   * the skill, so we do NOT build a decoded-events query path.
   */
  decodedDatasetA: 'bigquery-public-data.goog_blockchain_ethereum_mainnet_us',
  decodedDatasetB: 'bigquery-public-data.blockchain_analytics_ethereum_mainnet_us',
  /** Jobs must run in US multi-region (skill: "pass `location: 'US'`"). */
  location: 'US' as const,
} as const;

/**
 * Mainnet launch timestamp. The skill "Gotchas" requires every query to add
 * `block_timestamp >= TIMESTAMP('2026-01-29')` — it bounds correctness
 * (no events exist before launch) AND prunes the partition scan / bill.
 */
export const MAINNET_LAUNCH_TIMESTAMP = '2026-01-29' as const;

/**
 * UNVERIFIED / TODO (do NOT use for live queries until verified):
 *  - Testnet registry addresses ("MinimalUUPS v0.0.1") and Arc Testnet
 *    config exist in the skill, but the skill states BigQuery "only covers
 *    Ethereum mainnet (+ a few L1/L2s), not Arc", so reputation reads here
 *    are mainnet-only and these are intentionally omitted from query code.
 *  - The Google-managed `logs` per-column schema and `decoded_events` args
 *    index order are "NOT FOUND IN DOCS" per the skill — verify in the
 *    BigQuery console before adding any decoded-events query path.
 */

/** Turn a uint256 agentId into a 32-byte left-padded topic for `topics[OFFSET(1)]`. */
export function agentIdToTopic(agentId: bigint): string {
  return '0x' + agentId.toString(16).padStart(64, '0');
}
