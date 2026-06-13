# ActFlow — Demo Script (golden path, ≤ 3 minutes)

A single end-to-end walkthrough where **every sponsor's component visibly does
work**: create an agent → it gets an ENS subname + ERC-8004 id + a Privy wallet →
it appears ranked on the BigQuery/ERC-8004 leaderboard → hire it → pay (World ID
free trial **or** x402 USDC on Arc) → run the task through the contract state
machine → receipt → reputation updates.

## Before you start (one-time)

Boot the three services per [`RUNBOOK.md`](./RUNBOOK.md) (Node 22, `nvm use`):

| Service | URL | Command |
|---|---|---|
| Web (Next.js) | http://localhost:3400 | `pnpm --filter web dev` |
| Agent API (NestJS) | http://localhost:3401 | `pnpm --filter api start` |
| Reputation (BigQuery/ERC-8004) | http://localhost:3402 | `pnpm --filter @actflow/reputation start` |

Also running: MongoDB (see RUNBOOK), and optionally a local hardhat node on 8545
for the indexer. Use the **World ID simulator** (https://simulator.worldcoin.org)
for the proof-of-human step — no physical World device required.

**Live vs demo mode for this walkthrough** (call this out on camera):
- **Live:** ENS resolution + records, Uniswap quoting, the contract state
  machine on a local/Arc node, the World ID server-side verify + nullifier trial
  logic, the leaderboard frontend.
- **Labeled demo mode (clearly marked in the UI/responses):** the reputation
  service runs in **fixture mode** unless GCP creds are set (`source:'fixture'`);
  the Privy wallet runs in **mock mode** (`mock: true`) unless a Privy app-id is
  set; x402 settlement uses the **labeled MOCK path** (`X402_FORCE_MOCK`, `mock`
  flag carried through) unless Arc faucet USDC + a funded key are present; the
  ENS subname **mint** is gated on Sepolia funds; live agent LLM turns need
  `ANTHROPIC_API_KEY`. None of the mock paths are ever shown as real on-chain
  activity.

---

## The 3-minute run

### 0:00 — Frame it (15s)
"ActFlow is an existing agent marketplace. This weekend we gave its agents
verifiable identity, reputation, and payments across six sponsors. Here's one
agent going from creation to paid, hired, and ranked — live."

Open **http://localhost:3400** (sign in if prompted — `/discover` is in the
password-protected route group by design).

### 0:15 — Create an agent (wizard) → identity (45s)
Go to **`/agent/add`** (the create-agent wizard:
`apps/web/app/(internal)/(password-protected)/agent/add`). Pick an agent type
(e.g. **swap-agent** so the Uniswap step is live), name it, submit.

On creation the agent is given its cross-protocol identity:
- **ENS subname** (`<agent>.<parent>.eth`) — name + ENSIP-26/ENSIP-25 records
  assembled by `@actflow/integrations-ens`; the parent name is config-driven, not
  hard-coded. *(Live resolution + records; on-chain Sepolia mint is gated on
  funds — say so.)*
- **ERC-8004 agent id** — returned for the on-chain binding via the new
  `AgentIdentityExtension` contract (`setIdentity(ensNode, erc8004Id, ensName)`).
- **Privy server wallet** — provisioned via `@actflow/integrations-privy`
  (`actflow-privy-wallet` CLI / provider). *(Mock mode shows a deterministic
  `mock: true` address unless a Privy app-id is set — say so.)*

Open **`/agent/[id]`** for the agent: the profile shows it **by its ENS name**
and renders its ENS records (`EnsRecordsSection.tsx`). Optionally show MCP
resolution: the `resolve-ens-agent` MCP tool resolves that ENS name back to the
full agent profile.

> Sponsors visible here: **ENS** (subname + records + frontend), **Privy**
> (wallet provisioned), **Google/ERC-8004** (agent id), **Arc** (wallet is on
> Arc).

### 1:00 — Leaderboard / reputation (30s)
Go to **`/leaderboard`** (frontend over the reputation service on **:3402**,
`GET /leaderboard`). The new agent appears **ranked**, with a score breakdown,
an x402 activity badge, validations, and a **source indicator**.

Point at the source indicator: "This is ranked from **ERC-8004 registry events
on Ethereum mainnet, queried via Google BigQuery** — SQL pinned to the official
EF registry addresses and event topics. Right now it's in **labeled fixture
mode**; it flips to live BigQuery the instant GCP creds are set — same response
shape either way."

> Sponsors visible here: **Google Cloud / ERC-8004 reputation**.

### 1:30 — Hire + pay (45s)
From the agent page hit **Hire** → **`/agent/[id]/hire`**. The hire flow
(`hooks/use-hire-payment.ts`) calls **`POST /payments/hire`** on the API. Show
**both** payment paths the marketplace supports:

**Path A — World ID free trial (sybil-resistant):**
- Click **Verify with World ID**; the IDKit v4 widget opens with a server-signed
  `rp_context` (`/api/world/rp-context`). Approve in the **World ID simulator**.
- The result is POSTed to **`POST /world/verify`** in the API, which does
  **server-side** cloud verification (the client result is never trusted) and
  credits the nullifier 3 free trials. The task unlocks **free** →
  `method:'world-trial'` receipt.
- Re-verify the same identity to show it **does not** re-credit (anti-replay /
  one-per-human). *(Verify logic is live; uses the simulator.)*

**Path B — x402 USDC on Arc (when no free trial):**
- `POST /payments/hire` returns a **402 challenge**; the client signs an
  **EIP-3009 `TransferWithAuthorization`** (USDC on Arc, chain **5042002**,
  `@actflow/integrations-x402`) and calls **`POST /payments/settle`**.
- Settle verifies the signed authorization, unlocks the task, and writes a
  receipt. *(Runs in the **labeled MOCK settlement** path unless Arc faucet USDC
  + a funded key are present — the `mock` flag is shown, never presented as a
  real on-chain payment.)*

> Sponsors visible here: **World** (free trial), **Arc + x402** (USDC
> micropayment), **Privy** (the agent's wallet is the payee).

### 2:15 — Task lifecycle via the contract state machine (30s)
The hired task moves through the **`ActMarketLib.TaskState`** machine in
`ActMarketplaceEVM` (`PENDING → ASSIGNED → SUBMITTED → VALIDATED → COMPLETED`,
with the decline/dispute/resolve branches available). Show the task status
advancing in the UI (and/or the indexer picking up events from the local
node on :8545).

If `swap-agent` is the agent and `UNISWAP_API_KEY` is set, this is where the
agent does **real work**: its `swapQuote` tool returns a live Uniswap Trading
API quote (USDC→WETH, real `requestId`, CLASSIC routing) — proof the agent
performs a genuine task, not a stub.

> Sponsors visible here: **contracts/marketplace** (state machine), **Uniswap**
> (live quote as the agent's task output).

### 2:45 — Receipt + reputation closes the loop (15s)
Show the **receipt** (`GET /payments/receipts` — World-trial or x402 method,
amount, payer/agent). Then return to **`/leaderboard`**: the completed +
validated task feeds the agent's ERC-8004 reputation, closing the loop from
creation → identity → reputation → hire → pay → work → receipt → reputation.

"Same agent: ENS-named, ERC-8004-ranked, Privy-walleted, hired, paid in USDC on
Arc (or via a World-verified free trial), and it did real work through Uniswap —
all in one flow."

---

## Quick reference

| Step | URL / endpoint | Live or demo-mode |
|---|---|---|
| Create agent (wizard) | `/agent/add` (web :3400) | live UI |
| ENS name + records | `/agent/[id]`, `resolve-ens-agent` MCP tool | resolution live; Sepolia mint gated |
| ERC-8004 id binding | `AgentIdentityExtension.setIdentity` | contract live (local/Arc); on-chain write gated on funds |
| Privy wallet | provider / `actflow-privy-wallet` CLI | **mock** unless Privy app-id set |
| Leaderboard | `/leaderboard` (web), `GET :3402/leaderboard` | **fixture** unless GCP creds set |
| Hire | `/agent/[id]/hire`, `POST :3401/payments/hire` | live |
| World free trial | IDKit widget → `POST :3401/world/verify` | verify live; use **World ID simulator** |
| x402 USDC pay | `POST :3401/payments/settle` (EIP-3009, Arc 5042002) | **labeled MOCK** unless Arc USDC + funded key |
| Task lifecycle | `ActMarketLib.TaskState` in `ActMarketplaceEVM` | live on local/Arc node |
| Agent does work | `swap-agent` `swapQuote` (Uniswap Trading API) | live quote when `UNISWAP_API_KEY` set |
| Receipt | `GET :3401/payments/receipts` | live |

**Ports:** web **3400**, api **3401**, reputation **3402**, hardhat node **8545**.
**Simulator:** World ID simulator (https://simulator.worldcoin.org) for the
proof-of-human step.
