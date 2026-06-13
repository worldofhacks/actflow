# World ID — Proof-of-Human Free-Trial Gating

ActFlow gives every new user a small number of **free agent trials** before they have to
pay (x402 / USDC). Free compute is the obvious sybil target: the only thing standing between
a marketplace of paid AI agents and an open faucet of free GPU time is "is this a unique
human?". World ID answers exactly that question with a zero-knowledge proof — no email, no
KYC, no wallet-farming.

## What breaks without proof-of-human

Free trials with no uniqueness check are a bot farm's dream:

- **Bot-farmed free trials drain agent compute.** Each free trial runs a real agent task
  (LLM calls, tool execution, on-chain bookkeeping). A script that spins up 10,000 throwaway
  accounts gets 10,000× the free compute — the platform eats the inference bill and real
  paying demand gets starved.
- **Email / captcha / wallet gating doesn't hold.** Emails are free and infinite, captchas
  are solver-farmed, and a fresh EVM address costs nothing — none of them prove *one human*.
- **Replay.** Without persisting a per-human key, the same proof (or the same trial grant)
  can be submitted repeatedly to re-mint trials.

World ID's **nullifier** is the fix: it is a unique identifier for a `(human, app, action)`
combination. The same human proving the same action always yields the same nullifier, but
nullifiers are unlinkable across apps. Store it once, and "one free-trial bucket per human"
becomes a database uniqueness constraint instead of a guessing game. It is also the
anti-replay key — a re-submitted proof maps to the same nullifier and never re-credits.

## What shipped this weekend

A NestJS `world` module in `apps/api` (`apps/api/src/world/`) that does **server-side ZK
proof verification** (the hard requirement — the client result is never trusted) and keys
free trials to the verified nullifier.

### Server-side verification (the hard requirement)

- The frontend opens the IDKit widget; the user proves humanness in the World App.
- The IDKit result payload is POSTed to **`POST /world/verify`** in `apps/api`.
- The backend forwards that payload **as-is (no field remapping)** to the World **cloud
  verify** endpoint and only trusts *that* verdict:
  - **v4 (current):** `POST https://developer.world.org/api/v4/verify/{WORLD_RP_ID}` — used
    when `WORLD_RP_ID` is set (the user provisioned a v4 relying party).
  - **v2 (fallback):** `POST https://developer.world.org/api/v2/verify/{WORLD_APP_ID}` —
    used automatically when `WORLD_RP_ID` is unset. The v2 endpoint is the stable,
    no-stated-shutdown fallback.
- Endpoint selection is **config-driven** (`apps/api/src/world/world.config.ts`); the host
  is overridable via `WORLD_API_HOST` for staging/simulator testing.
- On success the backend extracts the **nullifier** (v4 `nullifier` / `results[].nullifier`,
  v2 `nullifier_hash`). On failure it surfaces the World error code as a 4xx (`invalid_proof`
  → 400; `already_verified` / `exceeded_max_verifications` → 403 "trial already used").

> Auth header note: the skill documents `WORLD_API_KEY` as a server-only secret but does
> **not** specify the exact wire header for the verify call (UNVERIFIED). Per the build
> instructions we send it as `Authorization: Bearer <WORLD_API_KEY>`. If the v4 RP rejects
> that, the single place to change it is `buildUrl`/header assembly in
> `apps/api/src/world/world-verify.ts`.

### Nullifier-keyed trial store

- Mongoose collection **`worldtrials`** (`apps/api/src/world/schemas/world-trial.schema.ts`),
  one document per `nullifier_hash` with `freeTrialsRemaining` (initialised to **3**),
  `createdAt`, optional linked `userId`, and a **`UNIQUE (action, nullifierHash)`** index.
- **One-per-human semantics** (atomic upsert with `$setOnInsert`):
  - a **brand-new** nullifier is credited **3** free trials;
  - an **already-seen** nullifier returns its **current** remaining count and is **never
    re-credited** — re-verifying the same proof cannot mint more trials.
- **`consumeFreeTrial(nullifier)`** atomically decrements with a **`>= 0` floor**
  (`findOneAndUpdate` guarded by `freeTrialsRemaining >= 1`), and reports whether a free
  trial was consumed vs. whether **payment is required** (fall back to the x402 / USDC flow).

### Free-task integration point

`consumeFreeTrial` is wired into the task-creation path
(`apps/api/src/task/task.controller.ts`, `createTask`) at the exact spot where a task would
otherwise require payment. It is **additive and opt-in**: when the client supplies a
`worldNullifier`, one free trial is consumed before the task is registered; absent it, the
existing payment-critical flow is unchanged. This keeps the escrow/payment code decoupled
from World ID — the integration block is clearly marked so the payment owner can wire the
"skip on-chain reward when a free trial was consumed" decision without this stream touching
escrow logic. The consume call is also exposed directly as `POST /world/consume-trial`.

## API surface (for the frontend stream)

| Method & path | Body | Response |
|---|---|---|
| `POST /world/verify` | the IDKit result payload, forwarded **as-is** (top-level fields **or** `{ payload, action }`); `action` optional (defaults to `WORLD_ACTION_ID`) | `{ nullifier, freeTrialsRemaining, credited, apiVersion }` on 200; `{ message, code }` with 400/403/502 on failure |
| `GET /world/trials?nullifier=0x…` | — (or be JWT-authenticated to use the linked user) | `{ nullifier, freeTrialsRemaining }` |
| `POST /world/consume-trial` | `{ nullifier, action? }` | `{ consumed, paymentRequired, freeTrialsRemaining, nullifier }` |

The frontend never calls the World API directly — it only talks to these `apps/api`
endpoints. Verification happens entirely server-side.

## Configuration (no secrets in this doc)

All read from env via the existing `@nestjs/config` pattern (`WorldConfig`). All are
**optional** so the API still boots for DB-only work; World features simply require them.

| Env var | Purpose | Exposure |
|---|---|---|
| `WORLD_RP_ID` | v4 verify path segment (preferred when set) | server-only |
| `WORLD_APP_ID` | IDKit widget app id; v2 fallback verify path segment | public id (mirror as `NEXT_PUBLIC_WORLD_APP_ID` for the widget) |
| `WORLD_ACTION_ID` | action id (`free-trial`) | public (mirror as `NEXT_PUBLIC_WORLD_ACTION_ID`) |
| `WORLD_API_KEY` | auth for the verify endpoint | **server-only secret** |
| `WORLD_SIGNER_KEY` | RP signing key (client `signRequest` if the v4 flow needs it) | **server-only secret** |
| `WORLD_API_HOST` | override verify host (e.g. staging) — optional | server-only |
| `WORLD_FREE_TRIALS` | trials credited per new human (default 3) — optional | server-only |

`WORLD_API_KEY` and `WORLD_SIGNER_KEY` are server-only and must never reach the client.

## Tests

`apps/api/test/world.test.mjs` (Node 22 native `node --test`; run via `pnpm --filter api
test`). **The live World API is always mocked — no network calls.** Coverage:

- verify handler against a **mocked** World API success **and** failure (v4 + v2 endpoint
  selection, `Authorization: Bearer`, payload forwarded as-is, error-code → HTTP-status
  mapping including `already_verified` → 403);
- **nullifier uniqueness** — a second verify of the same nullifier does **not** re-credit
  (returns current remaining);
- **trial decrement** to 0 then **payment required**, with the `>= 0` floor preserved;
- unknown-nullifier consume → payment required; `getTrialsByNullifier` reads current
  remaining.
