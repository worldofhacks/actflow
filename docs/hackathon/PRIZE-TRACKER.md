# Prize Tracker — ETHGlobal NYC 2026

Status legend: 🔲 not started · 🟡 in progress (live-gated on a credential/funds) · ✅ demo-ready · ⛔ blocked

Build 13/13 · ~331 tests / 25 suites · `pnpm hackathon:e2e` 5/5 · CI green on GitHub.

| Prize | $ | Status | Hard requirements | Evidence / what flips it fully live |
|---|---|---|---|---|
| ENS Continuity | $4K | ✅ | ENS code written this weekend; functional demo; NO hard-coded values; clearly improves agent identity/discoverability; video or live demo; in-person booth Sun AM | Live mainnet resolution (vitalik.eth fwd/reverse); ENSIP-25/26 records; `AgentIdentityExtension` contract; full provision flow (`POST /agents/provision` → ERC-8004 register → ENS records → `setIdentity` args), add-agent wizard shows it; `resolve-ens-agent` MCP tool. On-chain subname mint / `setIdentityFor` gated on funds+signer. |
| ENS AI Agents | $5K | ✅ | (same as above — agent-identity focus) | Same flow; ERC-8004 registration + ENS identity + on-chain binding args produced per agent; CLI `actflow-register-agents` provisions the 3 first-party agents. |
| ENS pool | $6K split | ✅ | (same) | Same as above. |
| Google Cloud ERC-8004 | $5K | 🟡 | BigQuery as core query layer over Ethereum mainnet ERC-8004 data; official EF registry addresses; lightweight frontend on top | Service live in labeled fixture mode (35 tests; SQL pinned to verified EF registry addrs/topic0); `/leaderboard` frontend + `get-agent-reputation` MCP tool. **Flips to live BigQuery** with `GCP_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS`. |
| Uniswap API | $7K | ✅ | Valid API key from Uniswap Developer Platform; API used for core functionality; submit developer feedback form | Live mainnet USDC→WETH quotes (requestIds below); swap-agent `swapQuote`/`swapExecute` tools; feedback form drafted in README. Testnet execute gated on a funded wallet. |
| Arc Agentic Nanopayments | $3.25K | 🟡 | Agent-to-agent gas-free USDC micropayments on Arc; working frontend + backend; architecture diagram; video; repo link | Arc chain config (5042002); EIP-3009 x402 layer (29 tests); `/payments/hire`→402→`/settle`→receipt with **BINDING task unlock** (paid/trial unlocks the task, unpaid stays locked); web hire flow; architecture.svg. **Flips to live on-chain settlement** with Arc faucet USDC + funded payer key. |
| Privy Agent Wallet | $1.7K | 🟡 | Privy Agent Wallet CLI; agent performs ≥1 onchain action; demo shows agent using wallet/moving assets; written Privy-usage explanation | `actflow-privy-wallet` CLI; provider (`getAddress`/`getBalance`/`pay` → USDC transfer via Privy `sendTransaction`); 22 tests; Privy writeup in README. **Flips to real server wallet + onchain tx** with Privy app-id (secret already present). |
| World Track C | $2.5K | 🟡 | Existing product ✓; meaningful World ID integration; proof verification in BACKEND or contract; writeup of weekend additions | Server-side `/world/verify` (v4 cloud verify); nullifier-keyed trial store (3/human, no re-credit); wired into hire (binding free unlock); 11 tests; WORLD.md. **Flips to real proofs** with provisioned World app/rp/signer/api keys (provided). |
| Unlink Continuity | $1K | 🟡 | @unlink-xyz/sdk in existing project; ≥1 private primitive; demo shows existing flow running privately; README before/after | `@actflow/integrations-unlink` deposit→private transfer→withdraw (24 tests); `withdrawEarningsPrivately` in agents; canary SDK installs+imports; README before/after. **Flips to a real private transfer** with `UNLINK_API_KEY` + `UNLINK_MNEMONIC` + funded account/gas. |

## Blockers

All weekend feature work is landed (Phases 2–6 + gap-closure: MCP 5 tools, full
provisioning, binding unlock). The remaining items are LIVE-variant credentials/funds
the user must provision; every code path is built, tested, and dry-run/mock-safe
without them.

| Date | Blocker | Owner | Status |
|---|---|---|---|
| 2026-06-13 | Uniswap API key | user | ✅ provided + validated (live USDC→WETH quote returned) |
| 2026-06-13 | World ID app + keys (app_id, rp_id, signer_key, api_key, action) | user | ✅ provided; server-side verify + trial gating built & tested (live proofs flip on with the keys) |
| 2026-06-12 | Privy app ID — needs dashboard.privy.io signup (secret already present) | user | ⛔ open (provider+CLI mock-safe; app-id flips to real server wallet + onchain tx) |
| 2026-06-12 | GCP project + service-account JSON for BigQuery — needs console.cloud.google.com | user | ⛔ open (reputation runs on fixtures; `GCP_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS` flip to live BigQuery) |
| 2026-06-13 | ANTHROPIC_API_KEY — for live agent LLM turns | user | ⛔ open (runtime builds/tests without it) |
| 2026-06-13 | Sepolia funds + DEPLOYER_PRIVATE_KEY — for live ENS subname mint | user | ⛔ open (mint gated; resolution + provisioning preview + all else works) |
| 2026-06-13 | AGENT_IDENTITY_ADMIN_PRIVATE_KEY + AGENT_IDENTITY_EXTENSION_ADDRESS (+RPC) — for on-chain `setIdentityFor` binding | user | ⛔ open (provisioning returns a labeled dry-run identity preview without them) |
| 2026-06-13 | Arc faucet USDC + funded payer key — for live x402 on-chain settlement | user | ⛔ open (task-unlock decision is live; only on-chain settle is mocked without funds) |
| 2026-06-13 | UNLINK_API_KEY + UNLINK_MNEMONIC + funded account — for a real private transfer | user | ⛔ open (wrapper runs in labeled mock mode without them) |
| 2026-06-12 | Circle x402 docs page 404s (developers.circle.com/x402) — facilitator details unverified; building x402-style with EIP-3009 direct | claude | 🟡 workaround |

## Evidence log

| Date | Item | Evidence |
|---|---|---|
| 2026-06-13 | Uniswap Trading API key valid | live POST /v1/quote USDC→WETH on mainnet → 200, routing=CLASSIC, requestId e4DOtjGNCYcEP8w=, Permit2 permitData returned |
| 2026-06-13 | ENS live resolution working | @actflow/integrations-ens tests: forward-resolve vitalik.eth + reverse-resolve pass against mainnet RPC |

| 2026-06-13 | Uniswap swap-agent tool live | wired swapQuote returned real CLASSIC quote, requestId e4Hx-hbCCYcEPzQ=, amountOut 5975340123615612 (10 USDC->WETH mainnet) |

| 2026-06-13 | ERC-8004 reputation service live (fixture) | services/reputation 35/35 tests; SQL pinned to verified registry addrs/topic0; /leaderboard ranks agents w/ scores+x402+validations; flips to live BigQuery on GCP creds |

| 2026-06-13 | World ID server-side verify + trials | apps/api /world/verify (v4 cloud verify, server-only); nullifier WorldTrial store credits 3/human, no re-credit; 11 tests; IDKit v4 widget + server-signed rp_context in hire flow |

| 2026-06-13 | Arc + x402 + Privy payments | arcTestnet chain live (5042002); ActMarketplaceEVM deploy script w/ USDC escrow (local-deploy test); @actflow/integrations-x402 EIP-3009 (29 tests) + Privy wallet provider (22 tests); api /payments/hire->402->settle->receipt (payments 12 tests); web hire flow. Live settle gated on Arc faucet USDC + Privy app-id (labeled mock mode otherwise). |

| 2026-06-13 | Unlink private payouts | @actflow/integrations-unlink deposit->private transfer->withdraw on Arc (24 tests); agents withdrawEarningsPrivately (agents suite 62 tests); SDK canary installs+imports; labeled mock until API key+funds |

| 2026-06-13 | Payment/trial unlock is BINDING | TaskUnlockService wires the UnlockTaskHook into PaymentsService.hire/settle: a settled x402 payment OR a consumed World free-trial calls TaskService.unlockTask(resource) and marks the task record unlocked/funded + attaches the receipt; an UNPAID task is NOT unlocked (explicit test in apps/api/test/payments.test.mjs, 12 tests). On-chain escrow stays optional/mocked; the marketplace decision is real. |

| 2026-06-13 | Agent provisioning end-to-end | packages/agents provisionAgent = registerErc8004 (register(string agentURI) on the cited EF IdentityRegistry, default Arc 5042002) -> registerEnsIdentity (ENSIP-25/26 records, attestation refs the erc8004Id) -> AgentIdentityExtension.setIdentity args. apps/api POST /agents/provision orchestrates + persists ensName/ensNode/erc8004Id + optional on-chain setIdentityFor (provisioning 5 tests). CLI actflow-register-agents provisions swap-agent/research-agent/actle. Add-agent wizard calls it and renders the identity (Live vs Preview badge). All dry-run/mock-safe. |

| 2026-06-13 | MCP server = 5 tools | packages/mcp registers search-agents, search-tasks, resolve-ens-agent, get-agent-reputation (GET {REPUTATION_URL}/agents/:addr/reputation -> reputation service, fixture-safe), hire-agent (POST {API_BASE_URL}/payments/hire -> 402 challenge or 200 World-trial unlock, never fabricates a payment). 10 tests (src/tools/tools.test.ts). No hard-coded addresses/prices/chain ids. |

| 2026-06-13 | Build + tests + e2e green | pnpm build 13/13; pnpm test ~331 tests / 25 suites (contracts 37, agents 62, api 28, mcp 10, ens 25+3skip, uniswap 22+3skip, privy 22, x402 29, reputation 35, unlink 24, web 37); pnpm hackathon:e2e 5/5 (all labeled MOCK/fixture); CI green on GitHub (.github/workflows/ci.yml). |

## Tx-hash log

(append every onchain artifact here: chain, tx hash, what it proves)

(none yet — no LIVE on-chain settlement has run: every settlement path is in
labeled mock/dry-run mode pending the funds/keys in the Blockers table. Real tx
hashes will be appended here when those are provided.)
