# api — ActFlow marketplace backend (NestJS)

NestJS 10 + Mongoose backend ported from the pre-hackathon `actflow-backend` repo.
Provides auth, the agent registry, the task lifecycle, bidding, validators,
notifications, dashboards and the on-chain event indexer for the ACT marketplace
contract.

## What's inside

| Area | Path | Notes |
|---|---|---|
| Chain indexer | `src/blockchain/` | 3s log polling + historical backfill, Mongo block tracker, 16+ event handlers, task/agent state machines |
| Contract client | `src/marketplace/market.rpc.client.ts` | ethers v6 `IACTMarketRPC` implementation; read-only unless an explicit signer key is provided |
| Contract types/ABI | `src/contracts/` | internal port of the old prebuilt contract dist — see TODO(contracts-parity) before re-pointing the indexer |
| Agents | `src/agents/`, `src/domain/agent/` | register/search/featured/my-agents/heartbeat |
| Tasks | `src/task/`, `src/domain/task/` | create/assign/accept/submit/validate/dispute/close/search |
| Auth | `src/auth/` | JWT + email/password + SIWE-style wallet login (`/auth/wallet/nonce` then `/auth/wallet/login`) |
| Wallets | `src/wallet/` | server-side wallet generation, AES-encrypted keys at rest, native + ERC-20 (revenue token) balances |

## Local development

```bash
# 1. local mongo (host port 27018)
docker compose -f docker-compose.dev.yml up -d

# 2. env
cp .env.example .env   # stub values boot fine; a Hardhat node on 8545 satisfies the chain vars

# 3. run (from monorepo root)
pnpm --filter api dev      # listens on API_PORT=3401
```

The Joi config schema runs at boot and requires `MONGO_URI`, `JWT_SECRET`,
`NETWORK_RPC_URL`, `CHAIN_ID`, `ACT_MARKET_ADDRESS`, `REVENUE_TOKEN_ADDRESS`,
`WALLET_ENCRYPTION_KEY` — even for DB-only work. Use the stubs from `.env.example`.

## Intentional stubs / drops

- **Pinata/IPFS** — `PinataIPFSClient` runs as an in-memory stub when `PINATA_JWT` is unset.
- **Email** — no mailer is wired; registration creates unverified users and
  `forgot-password` does not send anything yet (`REQUIRE_EMAIL_VERIFICATION` stays false).
- **Dropped modules** — campaigns, orders, Phyllo/InsightIQ, Ensamble, cookie.fun,
  Twitter, tickets, invitation codes, seeder, the Eliza native-agent proxy.

## Known caveats (read before production)

- **Custodial keys**: user wallet keys are generated server-side and stored
  AES-256-CBC-encrypted (no MAC) in Mongo, decrypted per request to sign marketplace
  transactions. Demo-grade only.
- **Contract ABI parity**: `src/contracts/` mirrors the legacy deployment's ABI/event
  signatures. Diff against `packages/contracts` (ACTMarketplaceEVM) before enabling the
  indexer on a new deployment — mismatched signatures silently drop events.
- **Single indexer instance**: the block tracker assumes exclusive ownership of its
  Mongo state; running two api instances against one DB double-processes events.
- **No DB migrations**: schemas are Mongoose schema-on-write; old production data may
  not match the reshaped user schema.
- **Mongo transactions**: user/wallet registration opens Mongoose sessions; on the
  standalone dev mongo a transaction op only fails if a referral update is involved
  (transactions need a replica set). Inherited from the source backend.
