# Prize Tracker — ETHGlobal NYC 2026

Status legend: 🔲 not started · 🟡 in progress · ✅ demo-ready · ⛔ blocked

| Prize | $ | Status | Hard requirements | Evidence |
|---|---|---|---|---|
| ENS Continuity | $4K | 🔲 | ENS code written this weekend; functional demo; NO hard-coded values; clearly improves agent identity/discoverability; video or live demo; in-person booth Sun AM | |
| ENS AI Agents | $5K | 🔲 | (same as above — agent-identity focus) | |
| ENS pool | $6K split | 🔲 | (same) | |
| Google Cloud ERC-8004 | $5K | 🟡 | BigQuery as core query layer over Ethereum mainnet ERC-8004 data; official EF registry addresses; lightweight frontend on top | |
| Uniswap API | $7K | 🟡 | Valid API key from Uniswap Developer Platform; API used for core functionality; submit developer feedback form | |
| Arc Agentic Nanopayments | $3.25K | 🔲 | Agent-to-agent gas-free USDC micropayments on Arc; working frontend + backend; architecture diagram; video; repo link | |
| Privy Agent Wallet | $1.7K | 🔲 | Privy Agent Wallet CLI; agent performs ≥1 onchain action; demo shows agent using wallet/moving assets; written Privy-usage explanation | |
| World Track C | $2.5K | 🟡 | Existing product ✓; meaningful World ID integration; proof verification in BACKEND or contract; writeup of weekend additions | |
| Unlink Continuity | $1K | 🔲 | @unlink-xyz/sdk in existing project; ≥1 private primitive; demo shows existing flow running privately; README before/after | |

## Blockers

| Date | Blocker | Owner | Status |
|---|---|---|---|
| 2026-06-13 | Uniswap API key | user | ✅ provided + validated (live USDC→WETH quote returned) |
| 2026-06-13 | World ID app + keys (app_id, rp_id, signer_key, api_key, action) | user | ✅ provided (validate during Phase 5 build) |
| 2026-06-12 | Privy app (ID + secret) — needs dashboard.privy.io signup | user | ⛔ open |
| 2026-06-12 | GCP project + service-account JSON for BigQuery — needs console.cloud.google.com | user | ⛔ open (blocks Phase 3 live queries; code builds against fixtures) |
| 2026-06-13 | ANTHROPIC_API_KEY — for live agent LLM turns | user | ⛔ open (runtime builds/tests without it) |
| 2026-06-13 | Sepolia funds + DEPLOYER_PRIVATE_KEY — for live ENS subname mint | user | ⛔ open (mint gated; resolution + all else works) |
| 2026-06-12 | Circle x402 docs page 404s (developers.circle.com/x402) — facilitator details unverified; building x402-style with EIP-3009 direct | claude | 🟡 workaround |

## Evidence log

| Date | Item | Evidence |
|---|---|---|
| 2026-06-13 | Uniswap Trading API key valid | live POST /v1/quote USDC→WETH on mainnet → 200, routing=CLASSIC, requestId e4DOtjGNCYcEP8w=, Permit2 permitData returned |
| 2026-06-13 | ENS live resolution working | @actflow/integrations-ens tests: forward-resolve vitalik.eth + reverse-resolve pass against mainnet RPC |

| 2026-06-13 | Uniswap swap-agent tool live | wired swapQuote returned real CLASSIC quote, requestId e4Hx-hbCCYcEPzQ=, amountOut 5975340123615612 (10 USDC->WETH mainnet) |

| 2026-06-13 | ERC-8004 reputation service live (fixture) | services/reputation 35/35 tests; SQL pinned to verified registry addrs/topic0; /leaderboard ranks agents w/ scores+x402+validations; flips to live BigQuery on GCP creds |

| 2026-06-13 | World ID server-side verify + trials | apps/api /world/verify (v4 cloud verify, server-only); nullifier WorldTrial store credits 3/human, no re-credit; 11 tests; IDKit v4 widget + server-signed rp_context in hire flow |

## Tx-hash log

(append every onchain artifact here: chain, tx hash, what it proves)
