# SALVAGE — Figment (private monorepo, mined for patterns only)

Source: `ACT-LABS-IO/Figment` (private). Policy: **copy patterns, never import packages or
git history.** Where ActFlow contracts are concerned: config rebuilt from scratch; source
git history not imported.

## Stack

Yarn/pnpm monorepo. `figment-api` (Express + Drizzle/Postgres + Redis, zod schemas),
`figment-agent` (ElizaOS runtime, Lerna plugin packages, PM2-spawned agent processes),
`figment-frontend` (React 19 + Vite), `figment-trade-mcp` (TS MCP server,
`@modelcontextprotocol/sdk`), `figment-mcp` (Python read-only MCP, 130+ tools),
`figment-runtime` (incomplete DBOS rework). Chain code is split ethers v6 (older) /
viem (newer Hyperliquid layer).

## What works (steal candidates, exact paths)

- **Agent provisioning flow** — `figment-api/src/controllers/agent-manager/setup.ts`:
  validate (zod `setupSchema` in `src/api-schema/wallet.validations.ts`) → payment-tx
  dedup ledger (`src/db/operations/agent-deployment-transactions.ts`) → per-agent wallet
  generated at creation → single DB transaction → spawn → **compensating rollback +
  failure log** (`src/db/operations/agent-creation-failures.ts`). Config schema:
  `figment-agent/agent-manager/src/agent-settings.schema.ts`; DB-record→runtime-character
  mapper with defaults: `figment-agent/agent-manager/src/types/mappers.ts`.
- **Onchain event indexer** — `figment-agent/packages/marketplace-plugin/src/`:
  two-phase design (fetch raw logs → persist with status → separate processor job),
  checkpointed `block-tracker.service.ts`, batched backfill + 15s polling
  (`blockchain/services/event-listener.service.ts`), topic-filtered `getLogs`
  (`blockchain/processors/block-processor.service.ts`), handler registry with retry
  states (`blockchain/processors/event-processor.service.ts`,
  `tasks/services/event-manager.service.ts`, `storage/stores/event-store.ts`).
- **Trading tools (paid-skill material)** — `figment-api/src/services/trenches/`
  (jupiter.ts quotes/swaps, birdeye.ts prices, safety.ts RugCheck+GoPlus token safety),
  `src/services/intelligence/` (alerts.ts signal engine, whale-tracker.ts, fear-greed,
  defillama, correlation — all Redis-cached with in-memory fallback + graceful
  degradation), `src/services/taapi/` (indicator client w/ key pool + rate limiting).
- **Wallet/viem utilities** — `figment-api/src/services/hyperliquid/wallet-provisioning.ts`
  (HD-derived per-agent wallets with trade-only API-wallet registration + nonce manager),
  `src/services/trading/hyperliquid-provider.ts` (viem EIP-712 signing, provider
  interface), `src/utils/db-encryption.ts` (AES-256-GCM field encryption),
  `src/services/agent-audit/` (hash-chained tamper-evident activity log),
  `src/services/agent-kill-switch/` (emergency halt + cancel-all).
- **MCP** — `figment-trade-mcp/src/server.ts` (tool-registry over low-level `Server`,
  zod `safeParse` + structured `ok/fail/translateError` in `tools/helpers.ts`),
  `src/rate-limiter.ts` (clean token bucket); Python server's read-only-by-default /
  credential-gated-writes / raw-data-out philosophy (`figment-mcp/server.py` header).
- **Agent-from-prompt authoring** — `figment-api/src/services/agent-authoring/`
  (conversation state machine + system prompt that emits a deployable config draft).

## Dead or coupled to dead infra

- **ElizaOS runtime** (`figment-agent/packages/core`, `client-*`, `plugin-bootstrap`,
  characters): replaced by Mastra in ActFlow. `elizaLogger`/`runtime.databaseAdapter`
  coupling leaks into otherwise-portable indexer code.
- **Orderly integration** (`figment-api/src/services/orderly/**`, `plugin-orderly`):
  sub-account/broker model is Figment-specific; setup.ts is threaded with it.
- **PM2 process-per-agent** (`figment-agent/agent-manager/`): port probing
  (`src/services/agent-registry.ts`) and port allocation (`src/utils/port-manager.ts`)
  are workarounds for an architecture ActFlow doesn't have.
- **`act-*` packages** (`figment-agent/packages/act-{api,contract,validator,...}`): stale
  copies of the older ACT marketplace modules; ActFlow already supersedes these
  (contracts: config rebuilt from scratch; source git history not imported).
- **figment-runtime / DBOS cutover**: unfinished parallel rework — reference only.
- Twitter/Telegram client plumbing, Remotion videos, figma assets, arena/campaigns.

## Verdict table

| Module | Verdict | Reason |
|---|---|---|
| `figment-trade-mcp/src` (server, helpers, rate-limiter, tool shape) | PORT | Framework-light, tested, drops into `packages/mcp` nearly as-is |
| `marketplace-plugin` indexer core (listener/tracker/block-processor/event-processor) | PORT | Sound checkpoint+status-queue design; mechanical swap ethers→viem, elizaLogger→our logger |
| `marketplace-plugin` storage stores | REWRITE | SQLite-via-Eliza adapter; redo on Drizzle/Postgres keeping the status/retry schema |
| Provisioning flow (`setup.ts` + deployment-tx/failure ledgers) | REWRITE | Pattern is gold (dedup, tx, rollback, failure audit); code is Orderly-threaded |
| `agent-settings.schema.ts` + `mappers.ts` | REWRITE | Schema shape + defaults-mapper pattern for Mastra agent configs |
| `trenches/` (jupiter, birdeye, safety) | PORT | Self-contained modules + caching; ideal paid skills |
| `intelligence/` (alerts, whale-tracker, etc.) | PORT | Standalone signal/alert engine; rename + swap logger/redis utils |
| `taapi/` indicator client | REWRITE | Useful key-pool/rate-limit pattern; heavy Figment config coupling |
| `hyperliquid/wallet-provisioning.ts` (HD wallets, nonce mgr) | PORT | Best-in-repo per-agent wallet assignment pattern for `packages/sdk` |
| `utils/db-encryption.ts`, `agent-audit/`, `agent-kill-switch/` | PORT | Small, audited utilities; marketplace needs all three |
| `trading/hyperliquid-provider.ts`, `plugin-hyperliquid` | REWRITE | viem EIP-712 signing worth lifting; venue itself optional for ActFlow |
| `plugin-evm/src/providers/wallet.ts` | REWRITE | Multi-chain viem client factory good; strip Eliza cache/TEE deps |
| `agent-authoring/` | PORT | Conversation→config-draft flow; swap venue/strategy prompt content |
| agent-manager PM2 spawner/registry/port-manager | DROP | Architecture mismatch (Mastra in-process) |
| `orderly/**`, `plugin-orderly` | DROP | Dead venue coupling |
| ElizaOS core/clients/characters, `act-*` packages, figment-runtime | DROP | Runtime replaced; modules superseded; rework unfinished |
| `figment-mcp` (Python) | DROP | Keep only its read-only/credential-gating philosophy |
