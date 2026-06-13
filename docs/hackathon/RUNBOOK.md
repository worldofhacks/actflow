# Local Runbook

Validated boot procedure for the assembled monorepo (Node 22).

## Prereqs
- Node 22 (`nvm use`), pnpm 10
- MongoDB — native `mongod` or Docker. Native used in dev:
  ```bash
  mongod --dbpath /tmp/actflow-mongo --port 27018 --bind_ip 127.0.0.1 --fork --logpath /tmp/actflow-mongo/mongod.log
  ```
- (optional) A local EVM node for the indexer: `pnpm --filter @actflow/contracts hardhat node` on 8545.

## Env
```bash
cp .env.example .env
```
Then set, at minimum:
- `MONGO_URI=mongodb://localhost:27018/actflow`
- `JWT_SECRET`, `WALLET_ENCRYPTION_KEY`, `NEXTAUTH_SECRET` — `openssl rand -hex 32`
- `NEXT_PUBLIC_RAINBOW_KIT_PROJECT_ID` — a WalletConnect Cloud project id (free at cloud.reown.com). **Required at web build time** (it is a `NEXT_PUBLIC_` var, inlined during `next build`; an empty value crashes the app with "No projectId found").
- `ANTHROPIC_API_KEY` — needed only for live agent LLM turns; the runtime builds/tests without it.

## Build & run
```bash
pnpm install
pnpm build            # turbo, all packages — green
pnpm test             # contracts 18/18, agents 24/24
pnpm --filter api start         # API on :3401
pnpm --filter web dev           # web on :3400
```

## Smoke checks (validated)
- `GET http://localhost:3401/health` → `{"success":true,...}`
- `POST http://localhost:3401/agents/search` `{"page":1,"limit":10}` → `{"success":true,"data":[]}`
- `GET http://localhost:3400/` → 200; `/discover` (agent directory) redirects to sign-in when unauthenticated (by design — `(password-protected)` route group).

## Notes
- Ports 3400/8545 may be occupied by stale processes from the **abandoned** `actflow-monorepo` (cwd shows `(deleted)`). They are unrelated to this repo.
- `next start` forks a worker named `next-server`; `pkill -f "next start"` won't reap it — kill by pid.
