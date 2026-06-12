---
name: arc-circle
description: Circle's Arc L1 blockchain (USDC-as-gas) — testnet chain config, USDC micropayments, Circle Wallets/App Kit, Gateway, ERC-8004 registries. Use when sending USDC on Arc, configuring viem/wallets for Arc testnet, wiring agent-to-agent x402-style payments, or registering ActFlow agents in ERC-8004 on Arc.
---

# Arc (Circle) — USDC Micropayments for ActFlow Agents

Arc is Circle's open EVM Layer-1 purpose-built for stablecoin finance. USDC is the
**native gas token** — fees are dollar-denominated (~$0.01/tx target). Sub-second
deterministic finality (Malachite consensus). Mainnet addresses are NOT yet published;
everything below is **Arc Testnet** unless stated. ActFlow relevance: agents hold USDC,
get paid per-task on Arc, and Arc testnet already hosts ERC-8004 identity/reputation
registries (same standard ActFlow queries on Ethereum mainnet via BigQuery).

## Setup & Auth

```bash
# Plain viem (Arc is standard EVM; arcTestnet ships in viem/chains per Arc tutorial)
npm install viem

# Circle App Kit — high-level send() with browser wallet
npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem
npm install --save-dev typescript vite

# Circle App Kit — with Circle developer-controlled wallets (server-side agent wallets)
npm install @circle-fin/app-kit @circle-fin/adapter-circle-wallets tsx
npm install --save-dev typescript @types/node

# Circle developer-controlled wallets SDK (used in Arc ERC-8004 tutorial)
npm install @circle-fin/developer-controlled-wallets
```

Env vars (Circle Wallets adapter):

```bash
CIRCLE_API_KEY=...        # from Circle developer console (developers.circle.com)
CIRCLE_ENTITY_SECRET=...  # entity secret for developer-controlled wallets
```

Plain viem needs no API key — just the public RPC. Fund wallets at
https://faucet.circle.com (select Arc Testnet).

Note for ActFlow: Privy is our wallet provider; Arc is standard EVM so any EOA/provider
works. Circle Wallets is an alternative documented by Arc itself.

## Core API

### App Kit send (exact shape from Arc quickstart)

```typescript
// Browser wallet adapter
const adapter = await createViemAdapterFromProvider({
  provider: selectedWallet.provider,
});

// Circle Wallets adapter
const adapter = createCircleWalletsAdapter({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const sendParams: SendParams = {
  from: { adapter, chain: "Arc_Testnet", address: sourceWalletAddress }, // address only for Circle Wallets
  to: recipientAddress,
  amount: "1.00",        // decimal string, not base units
  token: "USDC",
};
const result = await kit.send(sendParams);
```

### ERC-8004 registries on Arc Testnet (from Arc tutorial)

```solidity
// IdentityRegistry
register(string metadataURI)            // mints identity NFT for agent
ownerOf(uint256 tokenId)
tokenURI(uint256 tokenId)

// ReputationRegistry
giveFeedback(uint256 agentId, int128 score, uint8 feedbackType, string tag,
             string metadataURI, string evidenceURI, string comment, bytes32 feedbackHash)

// ValidationRegistry
validationRequest(address validator, uint256 agentId, string requestURI, bytes32 requestHash)
validationResponse(bytes32 requestHash, uint8 response, string responseURI,
                   bytes32 responseHash, string tag)
getValidationStatus(bytes32 requestHash)
```

### Fee estimation (from Arc gas-and-fees docs)

```typescript
const gasPrice = await provider.send("eth_gasPrice", []);
const feeHistory = await provider.send("eth_feeHistory", ["0x5", "latest", [25, 50, 75]]);
```

### Gateway / nanopayments / x402

- Circle Gateway supports **Arc Testnet (Domain 26)** and Arc mainnet (Domain 26);
  "most chains support nanopayments" per Gateway supported-blockchains page.
- Circle's nanopayment flow (per Circle blog + search coverage): buyer signs **EIP-3009
  payment authorizations**, verified offchain via a Gateway virtual ledger, settled
  onchain in batches — "gasless USDC micropayments down to $0.000001". Gateway batching
  was described as forthcoming ("available soon on testnet") in the blog.
- Exact Gateway/x402 API endpoints, facilitator URL, and x402 npm packages:
  NOT FOUND IN DOCS — verify before use (https://developers.circle.com/x402 returned 404
  on 2026-06-12; check developers.circle.com/llms.txt for current paths).
- Arc's own agentic-economy page documents ERC-8004 + **ERC-8183** (job lifecycle:
  creation, escrow funding, deliverable submission, evaluation, USDC settlement) — no
  x402 mention on that page.

## Addresses & Chain Config

All values verbatim from fetched sources. Testnet only — Arc mainnet contract addresses
NOT FOUND IN DOCS — verify before use.

| Item | Value | Source |
|---|---|---|
| Chain ID (testnet) | `5042002` | https://docs.arc.io/arc/references/connect-to-arc.md |
| RPC (primary) | `https://rpc.testnet.arc.network` | https://docs.arc.io/arc/references/connect-to-arc.md |
| RPC (alt) | `https://rpc.blockdaemon.testnet.arc.network`, `https://rpc.drpc.testnet.arc.network`, `https://rpc.quicknode.testnet.arc.network` | https://docs.arc.io/arc/references/connect-to-arc.md |
| WebSocket | `wss://rpc.testnet.arc.network` | https://docs.arc.io/arc/references/connect-to-arc.md |
| Explorer | `https://testnet.arcscan.app` | https://docs.arc.io/arc/references/connect-to-arc.md |
| Faucet | `https://faucet.circle.com` (select Arc Testnet) | https://docs.arc.io/arc/references/connect-to-arc.md |
| Native gas token | USDC (18 decimals at native level) | https://docs.arc.io/arc/references/connect-to-arc.md |
| USDC (ERC-20 interface, 6 decimals) | `0x3600000000000000000000000000000000000000` | https://docs.arc.io/arc/references/contract-addresses |
| EURC (6 decimals) | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | https://docs.arc.io/arc/references/contract-addresses |
| GatewayWallet (Domain 26) | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` | https://docs.arc.io/arc/references/contract-addresses |
| GatewayMinter (Domain 26) | `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B` | https://docs.arc.io/arc/references/contract-addresses |
| CCTP TokenMessengerV2 | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | https://docs.arc.io/arc/references/contract-addresses |
| CCTP MessageTransmitterV2 | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | https://docs.arc.io/arc/references/contract-addresses |
| FxEscrow | `0x867650F5eAe8df91445971f14d89fd84F0C9a9f8` | https://docs.arc.io/arc/references/contract-addresses |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` | https://docs.arc.io/arc/references/contract-addresses |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | https://docs.arc.io/arc/references/contract-addresses |
| ERC-8004 IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md |
| ERC-8004 ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md |
| ERC-8004 ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` | https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md |
| CCTP/Gateway domain | `26` | https://docs.arc.io/arc/references/contract-addresses |
| Min base fee (testnet) | 20 Gwei | https://docs.arc.io/arc/references/gas-and-fees.md |
| Max base fee | 1e-3 USDC per gas unit | https://docs.arc.io/arc/references/gas-and-fees.md |

Viem: the Arc tutorial imports `arcTestnet` from `viem/chains`. Manual fallback using
only verified values:

```typescript
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, // native level = 18
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"],
                        webSocket: ["wss://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});
```

## Gotchas

- **Dual-decimal USDC**: native gas accounting uses **18 decimals**; the ERC-20
  interface at `0x36...00` uses **6 decimals**. Same underlying balance, not two tokens.
  `parseEther` for native value transfers, `parseUnits(x, 6)` for ERC-20 `transfer`.
  Mixing these up over/under-pays by 10^12. The 6-decimal view truncates: `balanceOf`
  can read 0 while a sub-microdollar native balance exists (per EVM-differences doc).
- **Min gas price**: set `maxFeePerGas` >= 20 Gwei (testnet minimum) or txs won't land.
  `maxPriorityFeePerGas: 0` is valid; raise it for faster inclusion.
- **Blocklist semantics**: Arc enforces an onchain blocklist — "a value transfer to or
  from a blocklisted address reverts" and a reverting blocklist check still consumes gas
  (per Arc EVM-differences doc). The specific claim that Hardhat default account #1
  (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`) is blocklisted on Arc testnet is
  UNVERIFIED — verify before use (not found in Arc docs as of 2026-06-12; only the
  mechanism is documented, no specific address).
- **Wallet display**: wallets without custom-gas-token support work but may show
  balances incorrectly (they assume 18-decimal "ETH").
- **Fee smoothing**: EIP-1559 + EWMA (weighted moving average) — base fee moves slower
  than vanilla EIP-1559. Display fees to users in dollars, not Gwei.
- **No paymaster documented**: Arc docs (gas-and-fees) mention no paymaster/sponsored-tx
  mechanism. Gas-free micropayments go through Gateway nanopayments (offchain EIP-3009
  auth + batch settlement) — endpoints UNVERIFIED, see Core API.
- **`chain: "Arc_Testnet"`** (underscore) is the App Kit chain identifier — not
  "arc-testnet".
- App Kit `amount` is a decimal string (`"1.00"`), not base units.
- Mainnet exists in Gateway's chain list (Domain 26) but Arc docs say mainnet contract
  addresses are not yet available — don't hardcode any.

## Minimal Working Example

Send 0.05 USDC (a per-task agent payout) on Arc testnet via the ERC-20 interface:

```typescript
// npm install viem && export AGENT_PRIVATE_KEY=0x...  (fund via https://faucet.circle.com)
import { createWalletClient, createPublicClient, http, parseUnits, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains"; // per Arc ERC-8004 tutorial; else defineChain above

const USDC = "0x3600000000000000000000000000000000000000"; // Arc testnet ERC-20 interface
const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });
const client = createPublicClient({ chain: arcTestnet, transport: http() });

const hash = await wallet.writeContract({
  address: USDC,
  abi: parseAbi(["function transfer(address to, uint256 value) returns (bool)"]),
  functionName: "transfer",
  args: ["0xRecipientAgentWallet", parseUnits("0.05", 6)], // ERC-20 side = 6 decimals
  maxFeePerGas: 20_000_000_000n,        // 20 Gwei testnet minimum
  maxPriorityFeePerGas: 0n,
});
const receipt = await client.waitForTransactionReceipt({ hash });
console.log(`paid: https://testnet.arcscan.app/tx/${receipt.transactionHash}`);
```

Gas is deducted in USDC automatically (native token). For gas-free x402-style flows,
have the payer sign an EIP-3009 authorization instead and settle via Circle Gateway —
API surface UNVERIFIED, confirm current docs first.

## Sources

- https://docs.arc.io/ — fetched 2026-06-12 (landing; confirms docs.arc.io IS Circle's Arc — no substitution needed)
- https://docs.arc.io/llms.txt — fetched 2026-06-12 (doc site map)
- https://docs.arc.io/arc/references/connect-to-arc.md — fetched 2026-06-12 (chain ID, RPCs, explorer, faucet)
- https://docs.arc.io/arc/references/contract-addresses — fetched 2026-06-12 (USDC, Gateway, CCTP, domain 26)
- https://docs.arc.io/arc/references/gas-and-fees.md — fetched 2026-06-12 (USDC-as-gas, decimals, fee params)
- https://docs.arc.io/arc/references/evm-differences.md — fetched 2026-06-12 (blocklist semantics, 6-decimal truncation, PREVRANDAO=0, no blob txs)
- https://docs.arc.io/build/agentic-economy.md — fetched 2026-06-12 (ERC-8004/8183, Circle Wallets, compliance)
- https://docs.arc.io/app-kit/quickstarts/send-tokens-same-chain.md — fetched 2026-06-12 (packages, kit.send)
- https://docs.arc.io/arc/tutorials/register-your-first-ai-agent.md — fetched 2026-06-12 (ERC-8004 addresses + signatures, viem arcTestnet)
- https://developers.circle.com/gateway/references/supported-blockchains — fetched 2026-06-12 (Arc domain 26, nanopayments)
- https://www.circle.com/blog/enabling-machine-to-machine-micropayments-with-gateway-and-usdc — fetched 2026-06-12 (Gateway batching, x402 proposal)
- https://developers.circle.com/x402 — attempted 2026-06-12, HTTP 404 (x402 endpoint details remain unverified)
