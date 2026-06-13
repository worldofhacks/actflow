# SALVAGE: actflow-backend

Salvage audit of the NestJS "agent-ads-backend" for import into `apps/api`. Working-tree files only.
Where it consumes contracts, point it at the monorepo `packages/contracts` instead of the vendored
prebuilt dist (config rebuilt from scratch; source git history not imported).

## Stack

- NestJS 10 (Express) + TypeScript 5.8, Node 22; npm workspaces vendoring `phyllo-api-client`, `ensamble-api-client`, and a prebuilt `@act-1-the-prophecy/contract` dist under `src/packages/`
- MongoDB via Mongoose 8, repository pattern, **no migrations** (schema-on-write); `docker-compose.yml` = single `mongo:5.0` on host port 27018; tests use `mongodb-memory-server`
- Auth: Passport JWT bearer (`JWT_SECRET`) + local email/bcrypt + wallet-address login, roles guard, Google/Twitter/Telegram callback endpoints, email verification (nodemailer) gated by invitation codes
- Chain: ethers v6 against the ACT marketplace contract; `@story-protocol/core-sdk` (legacy); Pinata for IPFS metadata; `@nestjs/schedule` crons; RabbitMQ deps present but never connected

## What works

- **Chain indexer (`src/blockchain/`)** — the keeper. `MarketEventService` polls every 3s with a log filter built from `EVENT_SIGNATURES`, with historical backfill in 1000-block batches; Mongo block tracker + chain-event store (processing status per event); `EventProcessorService` drains on an interval through a handler registry (16 handlers: 6 agent, 10 task, plus admin/validator) with dependency ordering, waiting-event retry, and agent/task state machines. Chain-agnostic — needs only `NETWORK_RPC_URL`, `CHAIN_ID`, `ACT_MARKET_ADDRESS`.
- **Marketplace RPC client (`src/marketplace/market.rpc.client.ts`, 674 ln)** — full `IACTMarketRPC` implementation (ethers v6) used by both facades and indexer.
- **Agent registry (`src/agents/` + `src/domain/agent/facade.agent.service.ts`)** — `/agents`: `create-agent` (on-chain register + metadata), `search`, `featured-agents`, `my-agents`, `:agentAddress`, `:agentAddress/metadata`, `:agentAddress/update-last-online` (agent-runtime heartbeat carrying `instanceId`/`lastProcessedBlock`).
- **Tasks (`src/task/` + `src/domain/task/facade.task.service.ts`, 333 ln)** — `/tasks`: `create-task`, `assign-task`, `accept-task`, `submit-result`, `validate-task`, `dispute-task`, `close-tasks`, `search`, `:taskId`; metadata saved in Mongo, then registered on-chain; response timeframes derived from the on-chain config snapshot (`ContractConfigService`, updated by SetConfig events).
- **Supporting** — bidding (agent bids on tasks), validators, transactions history + dashboard aggregation, notifications, scheduler cron expiring overdue ASSIGNED tasks, server-side wallet generation with encrypted-at-rest keys, global response interceptor + exception filters, `/static` topic→skills dictionary.

## Dead or coupled to dead infra

- `src/native-agent/` — proxies chat to the retired Eliza agent runtime (`AGENT_URL`, hard-coded character id). Runtime replaced by Mastra; nothing to keep.
- Story Protocol residue: `wallet.service.ts` builds a Story SDK client (WIP-token balance, `depositWIP`, `'aeneid'` chain); `StoryProtocolConfig.contracts` getter expects `STORY_PROTOCOL_*` envs. Superseded by `ACTMarketplaceEVM` + `REVENUE_TOKEN_ADDRESS`.
- Influencer-ads era (pre-pivot product): `campaign/`, `orders/`, `phyllo/` + `get-phyllo-client/` + vendored `phyllo-api-client` (InsightIQ), `ensamble/` + vendored client, `cookie-fun/`, `twitter/` — external SaaS integrations; Phyllo fields are also woven into auth endpoints and user DTOs/schema and must be stripped there.
- RabbitMQ: `@golevelup/nestjs-rabbitmq`/`amqplib` deps, `RobustRabbitSubscribe` decorator, `RABBITMQ_URL` config — no module ever connects; vestigial (the `clear-messages` npm script even points at a non-existent path).
- Vendored `src/packages/act-contracts` (prebuilt dist only) — replace with monorepo `packages/contracts`; verify ABI/event-signature parity before wiring the indexer.
- `.github/workflows/aws-develop.yml`, `deploy/` scripts, `Dockerfile` — previous hosting setup.
- Invitation-code gating + `seeder/` bootstrap and SMTP-dependent mailer — friction for a hackathon deployment; disable or stub.

## Verdicts

| Module | Verdict | Reason |
|---|---|---|
| `blockchain/` (indexer, handlers, state machines) | PORT | Core event-sourcing engine; only env retargeting needed |
| `marketplace/market.rpc.client.ts` + `RetryService` | PORT | Complete contract client; rename `StoryProtocolConfig`, keep `network`/`deployment` getters only |
| `agents/`, `task/`, `domain/` facades | PORT | Registry + task lifecycle endpoints map 1:1 to the new product |
| `bidding/`, `validators/`, `notification/`, `config/` (contract config) | PORT | Mongo CRUD glued to indexer events; low effort |
| `common/` (filters, interceptors, retry, ipfs) + `scheduler/` | PORT | Drop only `mq-subscriber.decorator.ts` |
| `user/` + `auth/` | REWRITE | Keep JWT/guards/bcrypt core; replace wallet login with a SIWE-style signature flow; strip Phyllo/social fields and invitation gating |
| `wallet/` | REWRITE | Keep generation/encryption + native/ERC-20 balances via ethers; drop Story SDK paths (`depositWIP`, WIP client); revisit custodial key handling before production |
| `dashboard.controller.ts`, `static/` | PORT | Thin aggregations over kept services |
| `docker-compose.yml`, `.env.example`, tsconfigs | PORT | Local Mongo + env shape still correct; trim dead vars |
| `email/`, `invitation-code/`, `seeder/`, `ticket/` | DROP | SMTP/onboarding/support flows out of hackathon scope |
| `native-agent/` | DROP | Eliza runtime gone (Mastra replaces it) |
| `campaign/`, `orders/`, `phyllo/`, `get-phyllo-client/`, `ensamble/`, `cookie-fun/`, `twitter/`, `core/http` factories, vendored SaaS clients | DROP | Pre-pivot influencer product; external SaaS, no keys |
| RabbitMQ deps + decorator, `data/`, `deploy/`, AWS workflow | DROP | Never wired / environment-specific; not for import |
