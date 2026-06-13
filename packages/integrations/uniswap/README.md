# @actflow/integrations-uniswap

Uniswap Developer Platform **Trading API** integration for ActFlow agents.
Typed wrappers over `POST /quote`, `/check_approval`, `/swap` plus a full viem
execution path. Built strictly from the `uniswap-api` skill
(`.claude/skills/uniswap-api/SKILL.md`), which cites the official Uniswap docs +
OpenAPI spec. Base URL, header (`x-api-key`), and every request/response field
name match the skill verbatim.

## Rules honored

- **No hard-coded API key** — read from env `UNISWAP_API_KEY`.
- **No hard-coded chain IDs at call sites** — active swap chain from env
  `UNISWAP_SWAP_CHAIN_ID` (default Base Sepolia `84532`). Chain literals live
  only in the `SUPPORTED_CHAINS` map, each with a skill citation.
- **Token addresses are config/param-driven** — a small, clearly-labeled
  `{USDC, WETH}` map for chains `1`, `84532`, `11155111` with per-token source
  comments; everything overridable via `UNISWAP_TOKEN_<SYMBOL>_<chainId>`.

## Env vars

| Var | Purpose | Default |
|-----|---------|---------|
| `UNISWAP_API_KEY` | Trading API key (`x-api-key` header). Required for live calls. | — |
| `UNISWAP_SWAP_CHAIN_ID` | Default swap chain id (must be supported). | `84532` (Base Sepolia) |
| `UNISWAP_BASE_URL` | Override the API base URL (e.g. a server-side proxy). | skill constant |
| `UNISWAP_TOKEN_<SYMBOL>_<chainId>` | Override a well-known token address. | map value |
| `UNISWAP_RPC_URL_<chainId>` / `UNISWAP_SWAP_RPC_URL` | RPC for `executeSwap` / gated test. | — |
| `DEPLOYER_PRIVATE_KEY` | Funded key for the gated broadcast test only. | — |

## Usage

```ts
import {
  TradingApiClient,
  executeSwap,
  loadUniswapConfig,
  getTokenAddress,
} from "@actflow/integrations-uniswap";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const client = new TradingApiClient(); // key + chain from env

const quote = await client.getQuote({
  type: "EXACT_INPUT",
  amount: "10000000", // 10 USDC (6 decimals) — base-units STRING
  tokenIn: getTokenAddress("USDC", 1)!,
  tokenOut: getTokenAddress("WETH", 1)!,
  swapper: account.address,
  chainId: 1,
  slippageTolerance: 0.5,
  routingPreference: "BEST_PRICE",
});

// Execute (requires a FUNDED wallet — keys are never read by the library):
const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({ account, chain: mainnet, transport: http(process.env.RPC) });
const publicClient = createPublicClient({ chain: mainnet, transport: http(process.env.RPC) });

const { swapTxHash } = await executeSwap({
  quote,
  walletClient,
  publicClient,
  checkApprovalFor: { token: getTokenAddress("USDC", 1)!, amount: "10000000" },
});
```

`executeSwap` signs `permitData` (EIP-712, primaryType `PermitSingle`) when the
quote returns one, sends any `/check_approval` approval tx, converts the quote
via `/swap`, and broadcasts the returned tx with viem.

## Tests

```bash
pnpm --filter @actflow/integrations-uniswap build
pnpm --filter @actflow/integrations-uniswap test
```

- **UNIT** (`config.test.ts`, `body-assembly.test.ts`) — chain/token/config
  resolution and exact `/quote` + `/check_approval` + `/swap` request bodies.
- **LIVE** (`live-quote.test.ts`) — real mainnet USDC→WETH quote with
  `UNISWAP_API_KEY`; a default-testnet quote that tolerates thin liquidity.
  Skips gracefully if the key is unset or the network is down.
- **GATED** (`gated-execute.test.ts`) — `executeSwap` broadcast; runs only with a
  funded `DEPLOYER_PRIVATE_KEY` + RPC, else skips.
