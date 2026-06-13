# ActFlow — ETHGlobal NYC 2026 Submission

**Verified agent marketplace.** AI agents with onchain identity (ENS), onchain
reputation (ERC-8004 ranked via BigQuery), hireable and paid per-task with
x402-style USDC micropayments on Circle's Arc — with World ID-gated free trials
and optional private payouts via Unlink (shielded agent earnings).

Public repo: **https://github.com/worldofhacks/actflow**

This is a **continuity** submission: we took a pre-existing, real product and
spent the weekend giving its agents verifiable cross-protocol identity,
reputation, and payments. Every claim below is traceable to the repo, the test
suites, and `docs/hackathon/PRIZE-TRACKER.md`. Where something runs in a labeled
mock/fixture mode (because it is gated on a credential the user must provision),
we say so explicitly and say exactly what flips it live.

---

## What ActFlow was *before* this weekend

ActFlow predates the hackathon. The monorepo was assembled at NYC from **7
pre-existing source repos** — see [`PROVENANCE.md`](./PROVENANCE.md) for the full
list with the exact commit hash imported from each:

| Source repo | Visibility | Imported commit |
|---|---|---|
| ACT-LABS-IO/act-contracts | public | `f3663de` |
| ACT-LABS-IO/act-marketplace-module | public | `f155aad` |
| ACT-LABS-IO/actflow-contracts | private | `18d50f0` |
| ACT-LABS-IO/actflow-backend | private | `8843508` |
| ACT-LABS-IO/actflow-frontend | private | `93ad9e7` |
| ACT-LABS-IO/agent (Eliza runtime) | private | `0ba32c7` |
| ACT-LABS-IO/Figment | private | `ce359ea` |

**The before/after line is the git tag [`monorepo-assembled`](https://github.com/worldofhacks/actflow/tree/monorepo-assembled).**
Everything up to that tag is salvage and assembly of prior work (the
marketplace contract `ActMarketplaceEVM` + `ACTLib`, the NestJS backend, the
Next.js frontend, and the Eliza agent character/task-handler logic). Everything
*after* it is weekend feature work, landed across labeled phase tags:

```
hackathon-start ─► monorepo-assembled ─► phase2-ens ─► phase3-reputation ─► phase4-payments ─► phase5-worldid
└─ before ──────────────────────────┘└──────────────────── built this weekend ────────────────────────────┘
```

Provenance honesty notes (from `PROVENANCE.md`):
- `packages/contracts` is based on `actflow-contracts` **file content only** —
  fresh git history, `hardhat.config.js` rebuilt from scratch (the original
  carried a committed trojan; see `CONTRACTS-DIFF.md`), every imported file
  reviewed before landing.
- The Eliza `agent` repo contributed only character definitions, task-handler
  logic, and prompt templates; the **runtime was replaced with Mastra** this
  weekend.
- `Figment` was mined for patterns (provisioning flow, indexer, trading tools),
  never imported wholesale.

---

## Built this weekend — per prize

Monorepo layout (all packages build green under Node 22 / pnpm 10; `pnpm test`
across the tree):

```
packages/contracts        @actflow/contracts        37 contract tests passing
packages/sdk              @actflow/sdk              shared ABIs/types/chains/interfaces
packages/agents           @actflow/agents           48 tests
packages/mcp              @actflow/mcp              MCP server over the ActFlow API
packages/integrations/ens         @actflow/integrations-ens       28 tests (25 pass, 3 live-gated skip)
packages/integrations/uniswap     @actflow/integrations-uniswap   25 tests (22 pass, 3 live-gated skip)
packages/integrations/privy       @actflow/integrations-privy     22 tests
packages/integrations/unlink      @actflow/integrations-unlink    24 tests
packages/integrations/x402        @actflow/integrations-x402      29 tests
services/reputation       @actflow/reputation       35 tests
apps/api                  api                       19 tests (world 11 + payments 8)
apps/web                  web                       Next.js frontend
```

> Test counts are the authoritative numbers from running each suite under Node
> 22 on 2026-06-13. The ENS and Uniswap suites each have 3 tests that **skip**
> when their live credential (RPC / `UNISWAP_API_KEY`) is unset — they run when
> the key is present.

---

### ENS — Identity ($15K cluster: Continuity $4K + AI Agents $5K + pool $6K) — **DONE**

**What we added.** Cross-protocol, config-driven ENS identity for every agent,
end to end, with **zero hard-coded names, addresses, or chain ids**.

- **Live mainnet resolution** — `packages/integrations/ens` (`client.ts`,
  `namehash.ts`) does ENSIP-15 normalize → namehash, forward + reverse
  resolution, and text-record reads against a live mainnet RPC using viem.
  Evidence: forward-resolve `vitalik.eth` + reverse-resolve pass against the
  mainnet RPC (`live-resolution.test.ts`; recorded in `PRIZE-TRACKER.md`).
- **ENSIP-25 / ENSIP-26 records** — `packages/integrations/ens/src/records.ts`
  builds the ENSIP-26 `agent-context` / `agent-endpoint[<protocol>]` keys, the
  ENSIP-25 `agent-registration[<registry>][<agentId>]` attestation key (with
  parse/validate guards), and ENSIP-5 common keys (`description`, `url`,
  `avatar`). Keys that no ENSIP defines (capabilities/x402/pricing) are clearly
  marked `UNVERIFIED` and namespaced under `actflow.*` rather than faked as
  standard.
- **On-chain identity binding** — `packages/contracts/contracts/AgentIdentityExtension.sol`,
  a **new** standalone `Ownable` registry that links an agent address to its
  `(ensNode, erc8004Id, ensName)`. It is intentionally separate from the core
  marketplace (the marketplace `Agent` struct is untouched), enforces
  one-agent-per-ENS-node uniqueness with a reverse lookup, and **hard-codes no
  name, address, or chain id** — all identity values are caller-supplied at
  runtime. Tested in `packages/contracts/test/agent-identity-extension.test.js`
  (part of the 37 passing).
- **Agent self-registration path** — `packages/agents/src/identity/register-ens-identity.ts`
  computes the subname, writes ENSIP records, and returns the `ensNode` +
  `erc8004Id` for the `AgentIdentityExtension.setIdentity` call. It is a **dry
  run** (no network writes) unless a funded wallet and a configured parent name
  are both present.
- **MCP discovery** — `packages/mcp/src/tools/resolve-ens-agent.tool.ts` exposes
  `resolve-ens-agent`, resolving an agent's ENS name to its full `AgentProfile`,
  alongside `search-agents` / `search-tasks` and the `agent://`,
  `agent-metadata://`, `task://` resources.
- **Frontend ENS everywhere** — `/discover` and `/agent/[id]` render agents by
  ENS name and show their ENS records (`apps/web/.../agent/[id]/_components/EnsRecordsSection.tsx`,
  `apps/web/lib/config/ens.ts`, `hooks/use-agent-ens.ts`). The configured parent
  name lives in config, not in code.

**How it meets the hard requirements.** ENS code written this weekend ✓;
functional (live resolution proven) ✓; clearly improves agent
identity/discoverability (resolution + MCP + frontend + on-chain binding) ✓;
**NO hard-coded values** — every name/address/chain id is config-driven, and the
contract takes opaque caller-supplied identity ✓.

**Live vs gated.** Resolution, records assembly, the MCP tool, the contract, and
the frontend are all live. The only gated piece is **minting a real subname on
Sepolia**, which needs Sepolia funds + a funded `DEPLOYER_PRIVATE_KEY`; the mint
path is built and unit-tested (`sepolia-mint.test.ts`) and runs the moment those
are provided.

---

### Uniswap — Trading API ($7K) — **LIVE**

**What we added.** `packages/integrations/uniswap` — typed wrappers over the
**official Uniswap Developer Platform Trading API**
(`https://trade-api.gateway.uniswap.org/v1`, auth header `x-api-key`), covering
`POST /quote`, `POST /check_approval`, and `POST /swap` with Permit2 typed-data
signing (`client.ts`, `execute.ts`, `types.ts`, `config.ts`). The API key is
read from `UNISWAP_API_KEY` only — **zero hard-coded keys**. This is wired into
the agent runtime as the `swapQuote` / `swapExecute` tools on **`swap-agent`**
(`packages/agents/src/tools/swap-tools.ts`): `swapQuote` returns
`{ available:false, reason }` rather than a mock when no key is set, and
`swapExecute` never invents a tx hash — it prepares the unsigned swap tx and only
broadcasts when a funded wallet provider is injected.

**How it meets the hard requirements.** Valid key from the Uniswap Developer
Platform ✓ (validated live); the API powers core functionality — the agent's
swap capability ✓; developer-feedback form drafted (below) ✓.

**Live evidence (from `PRIZE-TRACKER.md`).**
- Live `POST /v1/quote` USDC→WETH on mainnet → 200, `routing=CLASSIC`,
  `requestId=e4DOtjGNCYcEP8w=`, Permit2 `permitData` returned.
- swap-agent `swapQuote` tool returned a real CLASSIC quote,
  `requestId=e4Hx-hbCCYcEPzQ=`, `amountOut=5975340123615612` (10 USDC→WETH,
  mainnet).
- Tests: 25 (22 pass; 3 live-quote/testnet-execute tests skip when
  `UNISWAP_API_KEY` is unset and run when present).

**Live vs gated.** Quoting is live against mainnet. **Testnet execution** (sign
Permit2 + broadcast `/swap` calldata) is built and gated on a funded wallet on
the swap chain.

---

### Google Cloud — ERC-8004 reputation ($5K)

**What we added.** `services/reputation` (`@actflow/reputation`) — a reputation
service that uses **BigQuery as the core query layer over Ethereum mainnet
ERC-8004 registry events**, ranks agents, and serves a leaderboard.

- **Registries pinned verbatim** — `services/reputation/src/bigquery/registry.ts`
  pins the EF reference ERC-8004 registry addresses (Identity
  `0x8004A1…a432`, Reputation `0x8004BA…9b63`, Validation `0x8004Cc…aB58`) and
  every event `topic0` keccak hash, copied verbatim, against
  `bigquery-public-data.crypto_ethereum.logs`.
- **SQL pinned to those addresses + topics** — `bigquery/queries.ts` decodes the
  registry events; the `sql-shape.test.ts` suite asserts the queries reference
  the verified addresses/topic0 and table (not free-floating SQL).
- **Scoring + leaderboard** — `scoring/scoring.ts` ranks agents; the Fastify app
  (`api/app.ts`) serves **`GET /leaderboard?sort=&limit=`** on **port 3402**
  (default). The frontend renders it at `/leaderboard` and `/discover`
  (`apps/web/components/leaderboard/*`), including a source indicator (live vs
  fixture), score breakdown, x402 badge, and sparkline.

**How it meets the hard requirements.** BigQuery is the core query layer over
mainnet ERC-8004 data ✓; official EF registry addresses ✓; lightweight frontend
on top ✓.

**Live vs gated — stated honestly.** The service runs in **labeled fixture mode
by default** (committed JSON fixtures; `source:'fixture'` in every response). The
live and fixture code paths return the **identical shape**, so scoring/API code
is path-agnostic. It **flips to live BigQuery automatically** when a
`GCP_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS` service-account JSON are
present (`config.ts` selects `mode: 'live' | 'fixture'`). Tests: 35 passing
(SQL-shape, scoring, API).

---

### Arc — Agentic Nanopayments ($3.25K)

**What we added.** Agent-to-agent USDC micropayments on **Circle's Arc** (chain
**5042002**, where USDC is the native gas token), implemented as an x402-style
EIP-3009 layer plus a config-driven escrow deploy.

- **Arc chain config in the SDK** — `packages/sdk/src/chains/arc.ts`:
  `ARC_TESTNET_CHAIN_ID = 5042002`, USDC ERC-20 at
  `0x3600000000000000000000000000000000000000` (6 decimals), faucet + explorer
  constants, all cited inline.
- **USDC-escrow deploy** — `packages/contracts/scripts/deploy.js` deploys
  `ActMarketplaceEVM` with a **config-driven revenue/escrow token** (no
  hard-coded WBNB): on chain 5042002 it defaults to Arc's native USDC ERC-20.
  Verified by `packages/contracts/test/deploy-script.test.js` — a local mirror of
  the arcTestnet deploy using a mock USDC token (real Arc deploy needs faucet
  USDC).
- **x402 / EIP-3009 layer** — `packages/integrations/x402` assembles the
  canonical `TransferWithAuthorization` EIP-712 typed data, signs it, builds the
  402 challenge, and verifies/settles (`eip3009.ts`, `sign.ts`, `verify.ts`,
  `challenge.ts`). 29 tests passing.
- **Payments flow in the API** — `apps/api/src/payments`:
  **`POST /payments/hire`** issues a 402 challenge (or unlocks free via a World
  trial), **`POST /payments/settle`** verifies the signed authorization and
  unlocks the task + writes a receipt, **`GET /payments/receipts`** lists
  receipts. Chain/USDC/explorer all come from the SDK — nothing hard-coded.
  Frontend hire flow in `apps/web/.../agent/[id]/hire` + `hooks/use-hire-payment.ts`.

**How it meets the hard requirements.** Agent-to-agent gas-free USDC
micropayments on Arc ✓; working frontend + backend ✓; repo link ✓ (architecture
diagram + video to accompany the booth demo).

**Live vs gated — stated honestly.** A labeled **MOCK settlement** path runs
without funds or keys (`X402_FORCE_MOCK`; the `mock` flag is carried end-to-end
so it is **never** presented as a real on-chain payment). Live settlement flips
on with Arc faucet USDC + a funded deployer/payer key (and Privy app-id for
agent wallets). Every on-chain artifact gets appended to the tx-hash log in
`PRIZE-TRACKER.md`.

---

### Privy — Agent Wallet ($1.7K)

**What we added.** `packages/integrations/privy` — a Privy **server-wallet**
provider for ActFlow agents plus a wallet-provisioning CLI.

- **Provider** — `provider.ts` implements the SDK's `IWalletProvider`
  (`getAddress` / `getBalance` / `pay`) backed by Privy server wallets on Arc:
  it provisions/loads the agent's server wallet, reads USDC balance via the
  configured Arc RPC, and sends a USDC ERC-20 transfer by submitting calldata
  through Privy's `sendTransaction` — the agent's onchain action.
- **CLI** — `bin: actflow-privy-wallet` (`dist/bin/provision-wallet.js`)
  provisions an agent wallet from the command line.
- 22 tests passing (provider, config, CLI).

**How it meets the hard requirements.** Privy Agent Wallet CLI ✓; the agent
performs ≥1 onchain action (USDC transfer via `sendTransaction`) ✓; written
Privy-usage explanation ✓ (below); demo shows the agent using its wallet (DEMO
script) ✓.

**Live vs gated.** Runs in a **deterministic, clearly-labeled MOCK mode** (every
result tagged `mock: true`; deterministic address/tx-hash from a seed) so it
builds and tests with no Privy account. It flips to real Privy server wallets
when a Privy **app-id** is set (the secret is present; the app-id is the gate).

---

### World — Track C, Proof-of-Human ($2.5K)

**What we added.** A NestJS `world` module (`apps/api/src/world/`) doing
**server-side ZK proof verification** (the client result is never trusted) and
keying free agent trials to the verified World ID nullifier. Full justification,
threat model, API surface, and config table are in **[`WORLD.md`](./WORLD.md)** —
that doc is the required weekend-additions writeup.

Highlights:
- `POST /world/verify` forwards the IDKit payload **as-is** to the World cloud
  verify endpoint (v4 `…/api/v4/verify/{WORLD_RP_ID}`, with v2 fallback) and
  trusts only that verdict; endpoint selection is config-driven.
- Nullifier-keyed trial store (`worldtrials`, `UNIQUE (action, nullifierHash)`):
  new humans get 3 trials; re-verifying the same proof **never re-credits**
  (anti-replay) and decrement floors at 0 → payment required.
- Wired into task creation as an additive opt-in
  (`apps/api/src/task/task.controller.ts`); frontend uses the IDKit v4 widget
  with server-signed `rp_context` (`apps/web/app/api/world/rp-context/route.ts`,
  `components/world/world-id-verify.tsx`).
- 11 tests; the live World API is always mocked in tests (no network).

**How it meets the hard requirements.** Existing product ✓; meaningful World ID
integration (sybil-resistant free-trial gating) ✓; proof verification in the
**backend** ✓; writeup of weekend additions ✓ (`WORLD.md`).

**Live vs gated.** The verify + trial logic is live server-side; testing uses the
**World ID simulator** (no real device needed). Real proofs require the
provisioned World app id / rp id / signer key / api key (provided).

---

### Unlink — Continuity ($1K) — **BUILT (private-payout path; live-gated on creds/funds)**

**What we added.** `packages/integrations/unlink` (`@actflow/integrations-unlink`)
— a private-payout wrapper that routes an agent's earnings (the marketplace
`withdraw()` proceeds) through `@unlink-xyz/sdk` so the **payout amount and
parties are shielded**.

- **Wrapper** — `client.ts` exposes `privateDeposit({amount})`,
  `privateTransfer({toUnlinkAddress, amount})`, and
  `privateWithdraw({toEvmAddress, amount})` over `@unlink-xyz/sdk/client` +
  `/admin` using the SKILL's **server/custodial** pattern
  (`account.fromMnemonic` → `createUnlinkAdmin` → `createUnlinkClient` →
  `ensureRegistered`), defaulting to Circle's **Arc Testnet** (`arc-testnet`,
  chain 5042002). The SDK is loaded via a **dynamic import** and is an
  **optional dependency**, so the package builds/tests even when the canary dep
  is absent.
- **Agent wiring** — `packages/agents/src/payouts/withdraw-earnings-privately.ts`
  adds `withdrawEarningsPrivately()`, which takes the `withdraw()` proceeds and
  runs **deposit → private transfer to the owner's `unlink1…` address → optional
  public cash-out**. `@actflow/agents` depends on `@actflow/integrations-unlink`
  (one direction); the unlink package depends only on `@actflow/sdk` (the
  dependency-free leaf with the Arc config) — **no dependency cycle** (verified
  by a clean full `pnpm build`).
- **No hard-coded secrets/addresses** — `UNLINK_API_KEY` / `UNLINK_MNEMONIC` are
  env-only; chain id / token are env-driven (Arc USDC default is the cited
  `@actflow/sdk` constant); Unlink's own contract addresses are resolved by the
  SDK from the selected environment, never inlined.
- **Tests** — 24 in the package (config/mock/validation) + 6 in agents
  (`withdraw-earnings-privately.test.ts`), all offline. The agents suite went
  **42 → 48** with no regressions.

**Before / after.**

- **Before:** agent earnings settle as plain USDC transfers on Arc — the payout
  amount and payee are fully public on-chain (`withdraw()` proceeds land in the
  agent wallet, then a public transfer pays the owner).
- **After:** the same `withdraw()` proceeds are shielded — `deposit()` into a
  private Unlink balance, then a `transfer()` to the owner's `unlink1…` address
  whose **sender, recipient, amount, and token are all hidden** by a Groth16
  zero-knowledge proof, with an optional `withdraw()` to a public EVM address
  only when cashing out. The rest of the hire→settle flow is unchanged.

**Live vs mock — stated honestly.** `@unlink-xyz/sdk@canary` (**0.3.0-canary.598**)
installs and imports cleanly, and the live code path is **verified up to the
network boundary**: the dynamic import of `/client` + `/admin`,
`account.fromMnemonic` (derives a real `unlink1…` address), `createUnlinkAdmin`,
and `createUnlinkClient` all succeed and the
`ensureRegistered`/`depositWithApproval`/`transfer`/`withdraw` methods are
present. Without creds the wrapper runs in a **deterministic, clearly-labeled
MOCK mode** (`mock: true`, `status: "mock-processed"`, a `mock-…` `txId`,
`txHash: null`) so build + tests + demo work with no account/API key/funds. It
flips to **real private transfers** when `UNLINK_API_KEY` + `UNLINK_MNEMONIC` are
set; a real end-to-end private transfer additionally needs a funded account and
(for the deposit) native gas — on Arc Testnet that gas is USDC itself (Circle
faucet). The single real private transfer for the demo runs once those creds +
funds are provided.

---

## Setup / run

Do not duplicate the runbook here — the validated boot procedure (prereqs, env,
build, run, smoke checks) lives in **[`RUNBOOK.md`](./RUNBOOK.md)**.

Quick orientation (Node 22 — `nvm use`):

```bash
pnpm install
pnpm build         # turbo, all packages — green
pnpm test          # contracts, agents, integrations, reputation, api
cp .env.example .env   # fill keys; see RUNBOOK.md for the minimum set
pnpm --filter web dev          # web   → http://localhost:3400
pnpm --filter api start        # api   → http://localhost:3401
pnpm --filter @actflow/reputation start   # reputation → http://localhost:3402
```

For the live golden-path walkthrough, see **[`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md)**.

---

## Per-sponsor required writeups

### Privy — how the agent wallet is used

ActFlow agents are autonomous processes that must hold value and pay each other,
so each agent gets a **Privy server wallet** rather than a user-custodied wallet.

**Provisioning.** A wallet is provisioned out-of-band via the
`actflow-privy-wallet` CLI (`packages/integrations/privy/bin/`) or in-process by
the provider, which creates/loads a Privy server wallet for the agent's logical
label. No private key is ever stored by ActFlow — Privy custodies the signing
key server-side; ActFlow only holds the wallet handle/address. The provider
implements the shared `IWalletProvider` interface from `@actflow/sdk`
(`getAddress` / `getBalance` / `pay`), so the rest of the runtime is wallet-
provider-agnostic.

**The agent's onchain action path.** When an agent needs to pay (e.g. settle an
x402 USDC charge, or pay another agent for a sub-task), the runtime calls
`provider.pay(...)`. The provider:
1. resolves the agent's Privy server-wallet address;
2. reads the USDC balance via the configured **Arc** RPC;
3. encodes a USDC ERC-20 `transfer` (Arc USDC at `0x3600…0000`, 6 decimals from
   the SDK);
4. submits that calldata through **Privy's `sendTransaction`**, which signs with
   the server-held key and broadcasts on Arc — this is the agent's ≥1 onchain
   action.

In mock mode every step is tagged `mock: true` with a deterministic address/tx
hash so the flow is demonstrable and testable with no Privy account; setting the
Privy app-id flips it to a real server wallet and real Arc transactions.

### World — justification

See **[`WORLD.md`](./WORLD.md)** for the full writeup. In short: ActFlow's free
agent trials are the obvious sybil target (each trial is real, paid-for LLM +
tool compute), and email/captcha/wallet gating can't prove *one human*. World
ID's nullifier turns "one free-trial bucket per human" into a database
uniqueness constraint and an anti-replay key. Verification is **server-side**
(`POST /world/verify` in `apps/api`), trials are keyed to the nullifier, and the
same proof can never mint extra trials.

### Unlink — before/after

See the Unlink section above. **Before:** Arc payouts are public USDC transfers —
amount + payee on-chain for anyone to see. **After:** the agent's `withdraw()`
proceeds are routed through `@unlink-xyz/sdk`
(`packages/integrations/unlink` + `withdrawEarningsPrivately` in
`packages/agents`): deposit → private transfer to the owner's `unlink1…` address
(sender/recipient/amount/token all hidden by a ZK proof) → optional public
cash-out, with the hire→settle flow otherwise intact. The wrapper runs in a
labeled MOCK mode with no creds (so build/tests/demo work offline) and flips to
real private transfers when `UNLINK_API_KEY` + `UNLINK_MNEMONIC` are set; the
canary SDK installs/imports cleanly and the live path is verified up to the
network boundary (see the Unlink section for the live-vs-mock detail).

### Uniswap — developer-feedback form (draft answers)

Grounded in the real integration in `packages/integrations/uniswap` +
`packages/agents/src/tools/swap-tools.ts`.

**What we built.** Typed TypeScript wrappers over the Trading API
(`/quote`, `/check_approval`, `/swap`) with Permit2 typed-data signing, exposed
as `swapQuote` / `swapExecute` tools on an autonomous Mastra agent
(`swap-agent`). The agent prices real swaps (validated live: USDC→WETH on
mainnet, `requestId e4DOtjGNCYcEP8w=` / `e4Hx-hbCCYcEPzQ=`, real CLASSIC routing
+ Permit2 `permitData`), and prepares the unsigned swap tx for execution behind
an injected wallet provider — it never fabricates a quote or a tx hash.

**Friction we hit.**
- The two-step Permit2 dance (`/check_approval` → sign `permitData` from
  `/quote` → pass both `permitData` and `signature` to `/swap`) is the main
  integration cost; it took the most reading to get the field names and the
  "pass both" requirement right, and is easy to get subtly wrong for an
  agent that has to do it unattended.
- `requestId` semantics across `/quote` → `/swap` (which id to echo, quote
  freshness/expiry) weren't obvious from a single page; we ended up echoing
  `quote.quoteId ?? requestId` defensively.
- For an *agent* flow, we wanted a crisp, machine-readable "no route /
  insufficient liquidity" signal so the agent can degrade gracefully rather than
  treat it as an error — we modeled `{ available:false, reason }` ourselves.

**What we'd want.**
- First-class agent/automation guidance: a documented, idempotent quote→swap
  contract (quote ttl, which id to reuse, what to do on expiry) so an unattended
  agent can retry safely.
- A single "prepare swap" helper that returns ready-to-sign Permit2 typed data
  *and* the final swap calldata together, to collapse the multi-call dance.
- Structured no-route / price-impact responses so agents can branch on them
  programmatically instead of string-matching errors.

---

## How to verify our claims

- **Continuity:** the tag chain `monorepo-assembled → phase2-ens →
  phase3-reputation → phase4-payments → phase5-worldid`, plus `PROVENANCE.md`
  (7 repos + commits) and `PRIZE-TRACKER.md` (evidence log + blockers).
- **Tests:** `pnpm test` (per-package: contracts 37, agents 48, ens 28, uniswap
  25, privy 22, unlink 24, x402 29, reputation 35, api 19).
- **Live evidence:** the Uniswap requestIds and the live ENS resolution entries
  in `PRIZE-TRACKER.md`.
- **Honesty:** every mock/fixture mode is labeled in code
  (`source:'fixture'`, `mock: true`, `X402_FORCE_MOCK`) and described above with
  the exact credential that flips it live.
