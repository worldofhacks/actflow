---
name: uniswap-api
description: Uniswap Developer Platform Trading API — REST quote/swap/approval endpoints, supported chains, and executing returned calldata with viem. Use when an ActFlow agent needs to price or execute a token swap (e.g. USDC->WETH), check Permit2 approvals, or integrate Uniswap trading into agent task flows.
---

# Uniswap Trading API (Developer Platform)

REST API that returns the best Uniswap route (v2/v3/v4 AMM "classic" or UniswapX
gasless orders) plus fully-formed transaction calldata. ActFlow fit: agent backends
(Mastra tools) call it server-side with the API key; the returned `swap` tx is signed
and broadcast by the agent's Privy wallet via viem. Note: Circle Arc is NOT in the
supported-chain list — USDC earned on Arc must be bridged to a supported chain before
swapping through this API.

## Setup & Auth

- **Get an API key**: Uniswap developer dashboard at https://developers.uniswap.org/dashboard
  (docs link to it as "API keys"). Docs also mention "shared playground keys or personal
  API keys from the dashboard".
- **Auth header**: `x-api-key: YOUR_API_KEY` (required on every request).
- **Base URL**: `https://trade-api.gateway.uniswap.org/v1`
- **OpenAPI spec**: `https://trade-api.gateway.uniswap.org/v1/api.json`
- **Other headers**: `accept: application/json`, `content-type: application/json`.
  Optional: `x-erc20eth-enabled: true` — "To use native ETH in UniswapX".
- Docs prerequisites: keep the key server-side ("Secure API Key Management" — protect
  from front-end exposure via proxy); you need your own RPC for broadcasting.

```bash
# No Uniswap-specific package required — it's plain HTTPS. For execution:
pnpm add viem
export UNISWAP_API_KEY=...        # from the dashboard
export RPC_URL=...                # your own RPC (docs: bring reliable RPC infra)
export AGENT_PRIVATE_KEY=...      # or use Privy wallet signing in prod
```

## Core API

All endpoints relative to `https://trade-api.gateway.uniswap.org/v1`:

| Endpoint | Method | Purpose (verbatim from docs) |
|----------|--------|------------------------------|
| `/check_approval` | POST | "Check if token approval is required" |
| `/quote` | POST | "Generate a quote for a token swap" |
| `/swap` | POST | "Convert an AMM quote into an unsigned transaction" |
| `/order` | POST | "Create a UniswapX order (gasless)" |
| `/swaps` | GET | "Check status of an AMM transaction" |
| `/orders` | GET | "Check status of a UniswapX order" |
| `/swap_5792` | POST | "Generate batch transactions for EIP-5792" |
| `/swap_7702` | POST | "Generate transaction with EIP-7702 delegation" |

### POST /quote
Request fields (from OpenAPI spec) — required: `type`, `amount`, `tokenInChainId`,
`tokenOutChainId`, `tokenIn`, `tokenOut`, `swapper`. Optional:
`generatePermitAsTransaction`, `autoSlippage`, `slippageTolerance`, `routingPreference`,
`protocols`, `hooksOptions`, `spreadOptimization`, `urgency`, `permitAmount`,
`recipient`, `integratorFees`, `walletExecutionContext`.

Doc example request body:

```json
{
  "tokenIn": "0x0000000000000000000000000000000000000000",
  "tokenOut": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "tokenInChainId": 1,
  "tokenOutChainId": 1,
  "type": "EXACT_INPUT",
  "amount": "1000000000000000000",
  "swapper": "0x...",
  "slippageTolerance": 0.5,
  "permitAmount": "FULL"
}
```

(`0x0000...0000` as `tokenIn` = native ETH in the doc example. `type` is
`EXACT_INPUT`; `routingPreference` active enum values: `"FASTEST"`, `"BEST_PRICE"`.)

Response top-level fields: `requestId`, `routing`, `quote`, `permitData`,
`permitTransaction`, `permitGasFee`, `sponsorshipInfo`.
- `routing` enum (OpenAPI `Routing`): `CLASSIC`, `DUTCH_LIMIT`, `DUTCH_V2`, `DUTCH_V3`,
  `BRIDGE`, `LIMIT_ORDER`, `PRIORITY`, `WRAP`, `UNWRAP`, `CHAINED`.
- `quote` (ClassicQuote) fields: `chainId`, `input` (`{amount, token, maximumAmount}`),
  `output` (`{amount, token, recipient, minimumAmount}`), `swapper`, `route`, `slippage`,
  `tradeType`, `quoteId`, `gasFeeUSD`, `gasFeeQuote`, `gasUseEstimate`, `gasPrice`,
  `priceImpact`, `txFailureReasons`, `maxPriorityFeePerGas`, `maxFeePerGas`, `gasFee`,
  `routeString`, `blockNumber`, `aggregatedOutputs`, `portionAmount`, `portionBips`,
  `portionRecipient`, `swapSteps`.
- `permitData` (OpenAPI schema name `Permit`, nullable): `{ domain, types, values }`.
  Spec's own response example: `types` = `{ PermitSingle: [...], PermitDetails: [...] }`,
  `values` = `{ details: { token, amount, expiration, nonce }, spender, sigDeadline }`,
  `domain` = `{ name: "Permit2", chainId, verifyingContract }`.
  If present, sign it as EIP-712 typed data before calling `/swap`.

### POST /swap
Request — required: `quote` (echo the full quote object from `/quote`). Optional:
`signature`, `permitData`, `includeGasInfo`, `refreshGasPrice`, `simulateTransaction`,
`safetyMode`, `deadline`, `urgency`.
Response: `requestId`, `swap`, `gasFee`. `swap` is a TransactionRequest:
`{ to, from, data, value, chainId, gasLimit, maxFeePerGas, maxPriorityFeePerGas, gasPrice }`.

### POST /check_approval
Request — required: `chainId` (default 1), `walletAddress`, `token` (ERC20 address),
`amount` (base units, string). Optional: `urgency`, `includeGasInfo`, `tokenOut`,
`tokenOutChainId`.
Response: `requestId`, `approval` (transaction object: `to, from, data, value, gasLimit,
chainId, maxFeePerGas, maxPriorityFeePerGas, gasPrice` — null if already approved),
`cancel`, `gasFee`, `cancelGasFee`.

### Routing split
- `routing` of `CLASSIC` / `WRAP` / `UNWRAP` / `BRIDGE` → submit via POST `/swap`
  with `{ quote, permitData, signature }`, then broadcast the returned tx yourself.
- `routing` of `DUTCH_V2` / `DUTCH_V3` / `PRIORITY` → submit via POST `/order`
  (gasless; fillers execute). OpenAPI `OrderRequest` requires all three of
  `{ quote, signature, routing }` (doc code examples show only `{ quote, signature }`;
  include `routing` to match the spec).

### Errors
Shape: `{ "error": "string", "message": "string", "details": {} }`.
Status codes: 200 OK; 400 invalid request (validation); 401 invalid API key;
429 "Rate limit exceeded"; 500 API error (retry with backoff); 503 temporary
unavailability (retry).

## Addresses & Chain Config

Base URL: `https://trade-api.gateway.uniswap.org/v1` — https://developers.uniswap.org/docs/trading/swapping-api/integration-guide
OpenAPI: `https://trade-api.gateway.uniswap.org/v1/api.json` — https://developers.uniswap.org/docs/trading/swapping-api/integration-guide

Supported mainnet chains (chain ID — name) — https://developers.uniswap.org/docs/trading/swapping-api/supported-chains:
1 Ethereum, 10 OP Mainnet, 56 BNB Smart Chain, 130 Unichain, 137 Polygon, 143 Monad,
196 X Layer, 324 zkSync, 480 World Chain, 1868 Soneium, 4217 Tempo, 8453 Base,
42161 Arbitrum, 42220 Celo, 43114 Avalanche, 59144 Linea, 81457 Blast, 7777777 Zora.

Testnets — https://developers.uniswap.org/docs/trading/swapping-api/supported-chains:
1301 Unichain Sepolia, 84532 Base Sepolia, 11155111 Ethereum Sepolia. Docs: "Only
Ethereum Sepolia and Unichain Sepolia are available as testnets on the Uniswap web
interface. All listed testnets are accessible via the API."

Note: the OpenAPI `ChainId` enum additionally lists IDs `4326`, `4663`, `5042`, `10143`
not documented on the supported-chains page — treat those as unannounced/UNVERIFIED.

USDT (mainnet, used in doc example): `0xdAC17F958D2ee523a2206206994597C13D831ec7` — https://developers.uniswap.org/docs/trading/swapping-api/integration-guide
Native ETH sentinel: `0x0000000000000000000000000000000000000000` — https://developers.uniswap.org/docs/trading/swapping-api/integration-guide
Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3` — appears as `permitData.domain.verifyingContract` (name "Permit2") in OpenAPI spec response examples for both chainId 1 and 8453 (https://trade-api.gateway.uniswap.org/v1/api.json). In practice use the API's `/check_approval` + the returned `permitData` rather than hardcoding.
USDC (Ethereum mainnet): `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` — appears in OpenAPI spec examples with `chainId: 1` (https://trade-api.gateway.uniswap.org/v1/api.json).
WETH (Ethereum mainnet): `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` — UNVERIFIED, not found in any fetched source; verify on a block explorer before use.
Circle Arc chain: NOT in the supported list above — do not route Arc swaps here.

## Gotchas

- `amount` is always a **string in base units** (USDC = 6 decimals, so 10 USDC =
  `"10000000"`; WETH = 18). Mixing decimals is the #1 quote bug.
- `slippageTolerance: 0.5` in the doc example means 0.5% (number, not bips).
- If `/quote` returns `permitData`, you MUST sign it (EIP-712) and pass both
  `permitData` and `signature` to `/swap`, or the swap reverts on Permit2.
- Branch on the `routing` response field: classic-family → `/swap` (you pay gas and
  broadcast); Dutch/priority family → `/order` (gasless UniswapX). UniswapX minimum
  order sizes: 300 USDC equivalent on Mainnet, 1,000 USDC equivalent on L2s
  (Arbitrum, Base) — small ActFlow micro-swaps will route CLASSIC.
- Rate limits: exact numbers NOT FOUND IN DOCS — only HTTP 429 "Rate limit exceeded"
  is documented. Implement backoff on 429/500/503.
- 401 = bad/missing `x-api-key`. The key goes in a header, not a query param. Keep it
  server-side (docs explicitly warn against front-end exposure; proxy it).
- Testnets work via the API even though the Uniswap web UI only exposes Ethereum
  Sepolia and Unichain Sepolia — good for hackathon dry runs, but testnet liquidity
  is thin so quotes may 400/404 for many pairs.
- Quotes pin to a `blockNumber`; re-quote if execution is delayed (staleness behavior
  beyond this field: UNVERIFIED).
- Doc code examples sign with ethers `signer._signTypedData(permitData.domain,
  permitData.types, permitData.values)` (no explicit primaryType). With viem, pass
  `primaryType: 'PermitSingle'` — that is the top-level type in the spec's own
  `permitData.types` example (`{ PermitSingle, PermitDetails }`).

## Minimal Working Example

Small 10 USDC -> WETH swap on Ethereum mainnet, executed with viem:

```ts
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const API = 'https://trade-api.gateway.uniswap.org/v1';
const HEADERS = {
  'x-api-key': process.env.UNISWAP_API_KEY!,
  accept: 'application/json',
  'content-type': 'application/json',
};
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // mainnet — matches OpenAPI spec examples (chainId 1)
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // UNVERIFIED — not in fetched docs; verify on etherscan before use

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({ account, chain: mainnet, transport: http(process.env.RPC_URL) });
const pub = createPublicClient({ chain: mainnet, transport: http(process.env.RPC_URL) });

const post = (path: string, body: unknown) =>
  fetch(`${API}${path}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
    .then(async (r) => { if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`); return r.json(); });

async function main() {
  // 1. Permit2 approval check (amount = 10 USDC, 6 decimals)
  const { approval } = await post('/check_approval', {
    walletAddress: account.address, token: USDC, amount: '10000000',
    chainId: 1, tokenOut: WETH, tokenOutChainId: 1,
  });
  if (approval) {
    const hash = await wallet.sendTransaction({ to: approval.to, data: approval.data, value: BigInt(approval.value ?? 0) });
    await pub.waitForTransactionReceipt({ hash });
  }

  // 2. Quote: EXACT_INPUT 10 USDC -> WETH
  const q = await post('/quote', {
    type: 'EXACT_INPUT', amount: '10000000',
    tokenIn: USDC, tokenInChainId: 1, tokenOut: WETH, tokenOutChainId: 1,
    swapper: account.address, slippageTolerance: 0.5, routingPreference: 'BEST_PRICE',
  });
  console.log(q.routing, 'out:', q.quote.output.amount, 'gasUSD:', q.quote.gasFeeUSD);

  // 3. Sign Permit2 typed data if required
  let signature: `0x${string}` | undefined;
  if (q.permitData) {
    signature = await wallet.signTypedData({
      domain: q.permitData.domain, types: q.permitData.types,
      primaryType: 'PermitSingle', // top-level type in the spec's permitData.types example
      message: q.permitData.values,
    });
  }

  // 4. Build + send tx (routing CLASSIC -> /swap; DUTCH_V2/V3/PRIORITY would go to /order)
  const { swap } = await post('/swap', { quote: q.quote, permitData: q.permitData, signature });
  const hash = await wallet.sendTransaction({
    to: swap.to, data: swap.data, value: BigInt(swap.value ?? 0),
    gas: swap.gasLimit ? BigInt(swap.gasLimit) : undefined,
    maxFeePerGas: swap.maxFeePerGas ? BigInt(swap.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: swap.maxPriorityFeePerGas ? BigInt(swap.maxPriorityFeePerGas) : undefined,
  });
  console.log('swap tx:', hash, (await pub.waitForTransactionReceipt({ hash })).status);
}

main().catch(console.error);
```

## Sources

- https://developers.uniswap.org — fetched 2026-06-12 (landing page; product/dashboard links)
- https://developers.uniswap.org/docs/trading/overview — fetched 2026-06-12 (endpoint roles)
- https://developers.uniswap.org/docs/trading/swapping-api/getting-started — fetched 2026-06-12 (workflow, UniswapX minimums)
- https://developers.uniswap.org/docs/trading/swapping-api/integration-guide — fetched 2026-06-12 (base URL, x-api-key, endpoints, schemas, errors)
- https://developers.uniswap.org/docs/trading/swapping-api/supported-chains — fetched 2026-06-12 (chain/testnet tables)
- https://developers.uniswap.org/docs/trading/swapping-api/swapping-code-examples — fetched 2026-06-12 (headers, request/response field usage)
- https://developers.uniswap.org/docs/trading/swapping-api/building-prerequisites — fetched 2026-06-12 (key management, RPC prerequisites)
- https://developers.uniswap.org/docs/api-reference — fetched 2026-06-12 (check_approval schema, dashboard)
- https://trade-api.gateway.uniswap.org/v1/api.json — fetched 2026-06-12 (OpenAPI: exact request/response fields, enums)
- https://api-docs.uniswap.org/guides/faqs — attempted 2026-06-12; 301-redirects to the getting-started page above (no separate FAQ content)
