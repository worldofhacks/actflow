---
name: erc8004-bigquery
description: ERC-8004 agent identity/reputation/validation registries (EF reference deployment) and querying their on-chain events via Google BigQuery public Ethereum datasets. Use when reading or scoring agent reputation, looking up agent registrations/feedback/validations on Ethereum mainnet, or writing BigQuery SQL / @google-cloud/bigquery code against registry logs for ActFlow.
---

# ERC-8004 Registries + BigQuery (ActFlow reputation pipeline)

ERC-8004 ("Trustless Agents") defines three upgradeable registries: **IdentityRegistry**
(ERC-721; each agent = one tokenId, `agentURI` points to registration JSON listing A2A/MCP/ENS
endpoints and x402 payment support), **ReputationRegistry** (signed fixed-point feedback:
`value` + `valueDecimals`, tags, endpoint, proof-of-payment metadata), **ValidationRegistry**
(validator hooks, 0-100 `response` confidence). Mainnet launch: 2026-01-29 (ethskills.com).
Agent identifier format (ethskills.com): `agentRegistry: eip155:{chainId}:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, `agentId` = ERC-721 tokenId.
For ActFlow: hire-side reputation reads come from BigQuery over Ethereum mainnet logs; writes
(giveFeedback after an x402 USDC payment) go on-chain via the agent's Privy wallet.

## Setup & Auth

```bash
npm install @google-cloud/bigquery        # v8.3.1 latest as of 2026-06-12 (registry.npmjs.org)
# Auth = Google Application Default Credentials:
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json   # cloud.google.com/docs/authentication/application-default-credentials
# or for local dev:
gcloud auth application-default login
export GCP_PROJECT_ID=<your-billing-project>   # queries bill to YOUR project; data is public
```

BigQuery public data lives in project `bigquery-public-data`; you query it from your own
project (needs BigQuery API enabled + `roles/bigquery.jobUser`). Datasets are US multi-region —
pass `location: 'US'` on jobs.

Contract ABIs (for on-chain reads/writes with viem): `abis/IdentityRegistry.json`,
`abis/ReputationRegistry.json`, `abis/ValidationRegistry.json` in
github.com/erc-8004/erc-8004-contracts (branch `master`). No npm package for the contracts is
documented in the repo README — vendor the ABI JSONs.

## Core API

### Contract functions (verbatim from repo ABIs)

IdentityRegistry (ERC-721):
- `register() returns (uint256 agentId)` — also overloads `register(string agentURI)` and `register(string agentURI, tuple[] metadata)`
- `setAgentURI(uint256 agentId, string newURI)`
- `getMetadata(uint256 agentId, string metadataKey) returns (bytes)` / `setMetadata(uint256 agentId, string metadataKey, bytes metadataValue)`
- `setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)`
- `ownerOf(uint256 tokenId) returns (address)`, `tokenURI(uint256 tokenId) returns (string)`

ReputationRegistry:
- `giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`
- `readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex) returns (int128 value, uint8 valueDecimals, string tag1, string tag2, bool isRevoked)`
- `readAllFeedback(uint256 agentId, address[] clientAddresses, string tag1, string tag2, bool includeRevoked) returns (address[] clients, uint64[] feedbackIndexes, int128[] values, uint8[] valueDecimals, string[] tag1s, string[] tag2s, bool[] revokedStatuses)`
- `getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)`
- `revokeFeedback(uint256 agentId, uint64 feedbackIndex)`
- `appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex, string responseURI, bytes32 responseHash)`

ValidationRegistry:
- `validationRequest(address validatorAddress, uint256 agentId, string requestURI, bytes32 requestHash)`
- `validationResponse(bytes32 requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)`
- `getValidationStatus(bytes32 requestHash) returns (address validatorAddress, uint256 agentId, uint8 response, bytes32 responseHash, string tag, uint256 lastUpdate)`

### Events you will filter on (from ABIs; topic0 = keccak256 of signature, computed locally from the ABI and verified against the canonical ERC-721 `Transfer` hash)

| Event (indexed marked `*`) | topic0 |
|---|---|
| `Registered(uint256 agentId*, string agentURI, address owner*)` | `0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a` |
| `URIUpdated(uint256 agentId*, string newURI, address updatedBy*)` | `0x3a2c7fffc2cba7582c690e3b82c453ea02a308326a98a3ad7576c606336409fb` |
| `MetadataSet(uint256 agentId*, string indexedMetadataKey*, string metadataKey, bytes metadataValue)` | `0x2c149ed548c6d2993cd73efe187df6eccabe4538091b33adbd25fafdb8a1468b` |
| `Transfer(address from*, address to*, uint256 tokenId*)` (agent ownership moves) | `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` |
| `NewFeedback(uint256 agentId*, address clientAddress*, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexedTag1*, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)` | `0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc` |
| `FeedbackRevoked(uint256 agentId*, address clientAddress*, uint64 feedbackIndex*)` | `0x25156fd3288212246d8b008d5921fde376c71ed14ac2e072a506eb06fde6d09d` |
| `ResponseAppended(uint256 agentId*, address clientAddress*, uint64 feedbackIndex, address responder*, string responseURI, bytes32 responseHash)` | `0xb1c6be0b5b8aef6539e2fac0fd131a2faa7b49edf8e505b5eb0ad487d56051d4` |
| `ValidationRequest(address validatorAddress*, uint256 agentId*, string requestURI, bytes32 requestHash*)` | `0x530436c3634a98e1e626b0898be2f1e9980cc1bd2a78c07a0aba52d0a48a5059` |
| `ValidationResponse(address validatorAddress*, uint256 agentId*, bytes32 requestHash*, uint8 response, string responseURI, bytes32 responseHash, string tag)` | `0xafddf629e874ccc3963b6a888c477bd464a6c8525024fc88759ea3b2326349ae` |
| `Upgraded(address implementation*)` (UUPS proxy upgrade — ABI may change after this fires) | `0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b` |

### BigQuery datasets / tables (Ethereum mainnet)

1. **Community (Ethereum ETL), simplest for logs**: `bigquery-public-data.crypto_ethereum.logs`
   Schema (verbatim, blockchain-etl/ethereum-etl-airflow enrich schema — this project builds the
   `crypto_ethereum` dataset): `log_index INT64 REQUIRED`, `transaction_hash STRING REQUIRED`,
   `transaction_index INT64 REQUIRED`, `address STRING`, `data STRING`,
   `topics STRING REPEATED`, `block_timestamp TIMESTAMP REQUIRED`, `block_number INT64 REQUIRED`,
   `block_hash STRING REQUIRED`.
2. **Google-managed (Blockchain Analytics)**: dataset `bigquery-public-data.goog_blockchain_ethereum_mainnet_us`
   (docs schema page) with tables `accounts_state`, `blocks`, `decoded_events`, `logs`,
   `receipts`, `token_transfers`, `traces`, `transactions`, plus materialized views `accounts`,
   `accounts_state_by_address`, `transactions_by_from_address`, `transactions_by_to_address`.
   Google's own example queries reference the same data as
   `bigquery-public-data.blockchain_analytics_ethereum_mainnet_us` — both IDs appear in official
   docs; if one 404s in your console, use the other. Per-column schema for its `logs` table:
   NOT FOUND IN DOCS — verify in the BigQuery console Schema tab before use.
   `decoded_events` columns used verbatim in Google's example: `block_timestamp`,
   `transaction_hash`, `address`, `event_signature` (full types-only signature string),
   `args` (access as `STRING(args[0])`, cast with `SAFE_CAST(... AS BIGNUMERIC)`).

## Addresses & Chain Config

Ethereum **mainnet** (chainId 1) — "MinimalUUPSMainnet v1.0.0" proxies:
- IdentityRegistry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` — repo README + scripts/addresses.ts (same address on Base, Arbitrum One, Optimism, Polygon, BSC, Avalanche, Linea, Scroll, Mantle, Celo, Gnosis and other listed mainnets)
- ReputationRegistry `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` — repo README + scripts/addresses.ts
- ValidationRegistry `0x8004Cc8439f36fd5F9F049D9fF86523Df6dAAB58` — scripts/addresses.ts (absent from the README deployment list, but verified live on mainnet 2026-06-12: `eth_getCode` non-empty and `getIdentityRegistry()` eth_call returns the mainnet IdentityRegistry address)

**Testnets** (Sepolia, Base Sepolia, Arbitrum Sepolia, etc.) — "MinimalUUPS v0.0.1" proxies, same address on every listed testnet:
- IdentityRegistry `0x8004A818BFB912233c491871b3d84c89A494BD9e` — repo README + scripts/addresses.ts
- ReputationRegistry `0x8004B663056A597Dffe9eCcC1965A193B7388713` — repo README + scripts/addresses.ts
- ValidationRegistry `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` — scripts/addresses.ts

Chain IDs (verbatim from scripts/addresses.ts): Ethereum `1`, Sepolia `11155111`, Base `8453`,
Base Sepolia `84532`, **Arc Testnet `5042002`** (in TESTNET_CHAIN_IDS; the README also lists an
explicit "Arc Testnet" section with Identity+Reputation at the testnet addresses above,
explorer `testnet.arcscan.app` — ValidationRegistry on Arc Testnet is addresses.ts-only,
unconfirmed on the explorer; an Arc *mainnet* chainId is NOT FOUND IN DOCS — verify before use).

## Gotchas

- **BigQuery only covers Ethereum mainnet (+ a few L1/L2s), not Arc.** ActFlow reads reputation
  from Ethereum mainnet (chainId 1) via BigQuery; Arc-side activity must be read via RPC.
- **Don't scan before launch**: registries went live on mainnet 2026-01-29; always add
  `block_timestamp >= TIMESTAMP('2026-01-29')` — it also prunes the partition scan and your bill.
- **Freshness**: dataset update latency is NOT FOUND IN DOCS — treat BigQuery as minutes-to-hours
  stale; never use it for payment-gating decisions that need the chain head.
- `topics` in `crypto_ethereum.logs` is `STRING REPEATED`: access `topics[OFFSET(n)]`, guard with
  `ARRAY_LENGTH(topics)`. Addresses/topics there are lowercase hex — lowercase your filters.
- Indexed `string` params (`indexedTag1` in NewFeedback, `indexedMetadataKey` in MetadataSet) are
  stored as the keccak256 hash of the string in the topic, not plaintext. Hash your expected tag
  to match it.
- Hex-string `SAFE_CAST(... AS INT64)` works in BigQuery but overflows above 2^63-1 and does NOT
  handle int128 two's complement: large/negative feedback `value`s must be decoded client-side
  (e.g. viem `decodeEventLog`). Real score = `value / 10**valueDecimals` (signed fixed-point).
- `NewFeedback` non-indexed `data` word layout: word0 `feedbackIndex`, word1 `value`,
  word2 `valueDecimals`, words3-6 string offsets, word7 `feedbackHash`. `value` =
  `SUBSTR(data, 67, 64)` (1-indexed positions in the full `data` string, `0x` prefix included:
  prefix = chars 1-2, word0 = 3-66, word1 = 67-130).
- Subtract `FeedbackRevoked` events when aggregating; or call `getSummary()` /
  `readAllFeedback(..., includeRevoked)` on-chain for the authoritative number.
- `register()` has 3 overloads — disambiguate with the full signature when encoding calldata.
- Registries are UUPS-upgradeable proxies; watch `Upgraded` and re-pin ABIs after an upgrade.
- `ValidationResponse.response` is `uint8` (ethskills.com describes it as a 0-100 confidence
  score). ValidationRegistry mainnet traffic may be near zero — handle empty result sets.

## Minimal Working Example

Reputation feed for one agent (Node 22, TypeScript, `@google-cloud/bigquery`):

```ts
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: process.env.GCP_PROJECT_ID }); // ADC auth

const REPUTATION_REGISTRY = '0x8004baa17c55a88189ae136b182e5fda19de9b63'; // mainnet, lowercased
const NEW_FEEDBACK_TOPIC0 =
  '0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc';

export async function recentFeedback(agentId: bigint) {
  const agentTopic = '0x' + agentId.toString(16).padStart(64, '0');
  const query = `
    SELECT
      block_timestamp,
      transaction_hash,
      log_index,
      SAFE_CAST(topics[OFFSET(1)] AS INT64)            AS agent_id,        -- indexed uint256
      CONCAT('0x', SUBSTR(topics[OFFSET(2)], 27))      AS client_address,  -- indexed address (last 20 bytes)
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 3, 64))  AS INT64) AS feedback_index, -- data word0
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 67, 64)) AS INT64) AS value_raw,      -- data word1 (int128; see Gotchas)
      SAFE_CAST(CONCAT('0x', SUBSTR(data, 131, 64)) AS INT64) AS value_decimals -- data word2
    FROM \`bigquery-public-data.crypto_ethereum.logs\`
    WHERE address = @registry
      AND topics[OFFSET(0)] = @topic0
      AND topics[OFFSET(1)] = @agentTopic
      AND block_timestamp >= TIMESTAMP('2026-01-29')   -- mainnet launch; prunes partitions
    ORDER BY block_timestamp DESC
    LIMIT 100`;
  const [rows] = await bq.query({
    query,
    location: 'US',
    params: { registry: REPUTATION_REGISTRY, topic0: NEW_FEEDBACK_TOPIC0, agentTopic },
  });
  return rows; // score = value_raw / 10**value_decimals (re-decode big/negative values via viem)
}
```

Alternative without manual decoding, on the Google-managed dataset (pattern verbatim from
Google's example-ethereum page):

```sql
SELECT block_timestamp, transaction_hash, STRING(args[0]) AS arg0
FROM `bigquery-public-data.blockchain_analytics_ethereum_mainnet_us.decoded_events`
WHERE event_signature = 'NewFeedback(uint256,address,uint64,int128,uint8,string,string,string,string,string,bytes32)'
  AND address = '0x8004baa17c55a88189ae136b182e5fda19de9b63'
LIMIT 10
-- args index order for decoded ERC-8004 events: NOT FOUND IN DOCS — inspect a sample row first.
```

## Sources

- https://github.com/erc-8004/erc-8004-contracts — fetched 2026-06-12 (contracts overview, mainnet/Sepolia Identity+Reputation addresses, function list)
- https://raw.githubusercontent.com/erc-8004/erc-8004-contracts/master/README.md — fetched 2026-06-12 (full multichain deployment list)
- https://raw.githubusercontent.com/erc-8004/erc-8004-contracts/master/scripts/addresses.ts — fetched 2026-06-12 (all three registry addresses incl. ValidationRegistry; chain IDs incl. Arc Testnet 5042002)
- https://raw.githubusercontent.com/erc-8004/erc-8004-contracts/master/abis/IdentityRegistry.json (+ ReputationRegistry.json, ValidationRegistry.json) — fetched 2026-06-12 (event/function signatures; topic0 hashes computed locally with js-sha3 keccak256, sanity-checked against ERC-721 Transfer)
- https://docs.cloud.google.com/blockchain-analytics/docs/supported-datasets — fetched 2026-06-12 (Ethereum mainnet GA dataset, marketplace link)
- https://cloud.google.com/blockchain-analytics/docs/schema — fetched 2026-06-12 (dataset ID goog_blockchain_ethereum_mainnet_us, table + materialized-view names)
- https://cloud.google.com/blockchain-analytics/docs/example-ethereum — fetched 2026-06-12 (decoded_events example SQL, blockchain_analytics_ethereum_mainnet_us dataset ID, args/STRING() access pattern)
- https://ethskills.com/standards/SKILL.md — fetched 2026-06-12 (ERC-8004 launch date, agentRegistry eip155 format, registry semantics, x402 context)
- https://raw.githubusercontent.com/blockchain-etl/ethereum-etl-airflow/master/dags/resources/stages/enrich/schemas/logs.json — fetched 2026-06-12 (crypto_ethereum.logs column schema)
- https://registry.npmjs.org/@google-cloud/bigquery/latest — fetched 2026-06-12 (package name + version 8.3.1)
- https://cloud.google.com/docs/authentication/application-default-credentials — fetched 2026-06-12 (GOOGLE_APPLICATION_CREDENTIALS)
- Ethereum mainnet JSON-RPC (ethereum-rpc.publicnode.com) — queried 2026-06-12: `eth_getCode` non-empty at all three mainnet registry addresses; `eth_call getIdentityRegistry()` on ValidationRegistry `0x8004Cc84...` returned IdentityRegistry `0x8004A169...`
