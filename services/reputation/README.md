# @actflow/reputation

Standalone reputation service for ActFlow. Ranks **ERC-8004** agents by their
on-chain reputation, feedback and validation activity, read from **Google
BigQuery** (the public Ethereum dataset) — or from committed **fixtures** when
no GCP credentials are present.

It is both an HTTP API (Fastify) and an importable library.

## Data source — AUTO mode

| Condition | Mode | `source` on responses |
|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` **and** `GCP_PROJECT_ID` both set | **live** | `"live"` |
| either missing/empty (default) | **fixture** | `"fixture"` |

In **fixture mode** the service returns the hand-authored sample data in
`src/fixtures/*.json` (see that dir's README). It is clearly labelled as
fixture data and never presented as live.

In **live mode** it runs the REAL parameterized SQL in `src/bigquery/queries.ts`
against `bigquery-public-data.crypto_ethereum.logs`, filtering by the ERC-8004
registry addresses + event `topic0` values taken verbatim from the
`erc8004-bigquery` skill. The same query strings are shape-tested against the
fixtures, so they work the moment credentials arrive.

> BigQuery covers **Ethereum mainnet only** (skill note). Reputation reads are
> mainnet (chainId 1). Arc-side activity must be read via RPC elsewhere.

## Run

```bash
export PATH=/home/actlabs/.nvm/versions/node/v22.22.3/bin:$PATH
pnpm --filter @actflow/reputation build
pnpm --filter @actflow/reputation start      # listens on :3402 (fixture mode by default)

curl localhost:3402/health
curl 'localhost:3402/leaderboard?sort=score&limit=10'
curl localhost:3402/agents/101/reputation
```

## Endpoints

- `GET /health` → `{ ok, service, mode, source }`
- `GET /leaderboard?sort=&limit=` → `{ source, sort, count, agents: RankedAgent[] }`
  - `sort` ∈ `score` (default) | `validations` | `recent` | `feedback`
  - `limit` 1..500 (default 50)
- `GET /agents/:address/reputation` → `{ source, agent: RankedAgent }`
  - `:address` accepts the owner address **or** the ERC-8004 tokenId

`RankedAgent`:

```jsonc
{
  "address": "0x…",          // owner of the ERC-721 agent token
  "erc8004Id": 101,           // ERC-8004 tokenId / agentId
  "score": 92.4,              // composite 0..100
  "breakdown": {
    "feedbackCount": 3,
    "revokedCount": 0,
    "averageValue": 4.8,
    "recencyWeightedValue": 4.9,
    "validationCount": 2,
    "averageValidationConfidence": 91.5,
    "daysSinceLastFeedback": 3.1
  },
  "validations": 2,
  "x402": true,               // derived from registration URI/metadata
  "sparkline": [0,1,0,2,1,0,3],
  "source": "fixture",        // or "live"
  "agentUri": "https://…#x402"
}
```

## Library use

```ts
import { ReputationService, loadConfig } from '@actflow/reputation';

const svc = new ReputationService(loadConfig());
const { source, agents } = await svc.leaderboard({ sort: 'score', limit: 10 });
```

## Scoring

Pure functions in `src/scoring/scoring.ts` (fully unit-tested):

- decoded feedback value = `value_raw / 10**value_decimals` (skill semantics)
- recency weight = `0.5 ** (ageDays / halfLife)` (half-life env-configurable)
- revoked feedback (`FeedbackRevoked`) subtracted before scoring
- validation confidence = mean of `ValidationResponse.response` (0-100)
- x402 flag = `x402` token present in the agent's registration URI / metadata
- sparkline = per-day feedback counts over the last N days (oldest→newest)
- composite = 70% recency-weighted reputation + 20% validation + 10% engagement

## Config (env)

See `.env.example`. All optional; the service runs out-of-the-box in fixture mode.

## Test

```bash
pnpm --filter @actflow/reputation test   # node:test — scoring units, SQL-shape, API contract
```

No live GCP is used in tests.
