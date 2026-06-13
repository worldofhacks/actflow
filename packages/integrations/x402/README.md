# @actflow/integrations-x402

x402-style USDC micropayments for ActFlow agents on Circle's **Arc**, built on
the **documented EIP-3009 `transferWithAuthorization`** pattern: the buyer signs
a USDC payment authorization off-chain, the resource server verifies it, and (in
real mode) settles it on Arc.

Built to `.claude/skills/arc-circle/SKILL.md`. The exact Circle x402 / Gateway
API is **UNVERIFIED** (Circle's x402 docs returned 404), so this package does NOT
depend on any Gateway facilitator endpoint — it uses the well-documented EIP-3009
authorization flow the skill cites for Circle nanopayments. Gateway-specific bits
are called out as UNVERIFIED below.

**No hard-coded secrets** (no keys anywhere; signing is delegated to a wallet).
Chain id / RPC / USDC address are env-driven; Arc testnet USDC is a cited
constant, all overridable.

## API

```ts
import {
  build402Challenge,
  signPaymentAuthorization,
  verifyPayment,
} from "@actflow/integrations-x402";

// 1. Resource server: price a resource (default asset = Arc USDC, chain 5042002)
const challenge = build402Challenge({
  amount: "0.05",
  recipient: "0xPayee…",
  resource: "https://api.actflow.test/premium",
});

// 2. Buyer agent: sign the EIP-3009 authorization (mock if wallet can't sign)
const payload = await signPaymentAuthorization(walletProvider, challenge);

// 3. Resource server: validate (+ settle on Arc if a funded settler is supplied)
const receipt = await verifyPayment(challenge, payload);
// -> { paid, txHash?, payer?, mock? }
```

### `build402Challenge(params)`

Returns a 402 PaymentRequired descriptor (the JSON body sent with HTTP 402):
`{ status: 402, scheme, network, chainId, amount, amountDecimal, recipient,
asset, resource, validAfter, validBefore, nonce }`. Amount is converted to USDC
base units (6 decimals); a random 32-byte nonce and a `validBefore` deadline are
generated (override both for deterministic tests).

### `signPaymentAuthorization(signer, challenge)`

Assembles the canonical EIP-3009 `TransferWithAuthorization` EIP-712 typed data
and asks `signer` to sign it. `signer` may be:
- an `IWalletProvider` (no typed-data signer) -> **mock** payload (`mock:true`),
- any viem-style signer exposing `signTypedData` -> a real, recoverable signature.

### `verifyPayment(challenge, payload, options?)`

Validates scheme/network/chainId/asset, recipient, exact amount, nonce, and the
time window, then:
- **mock** (`payload.mock`, no settler, or `X402_FORCE_MOCK`): returns a labeled
  `{paid:true, mock:true}` receipt — no settlement, no funds.
- **real** (a funded `settler` + RPC): recovers the payer from the signature and
  submits `transferWithAuthorization`, returning `{paid:true, txHash}`.

Validation failures return `{paid:false, reason}` (wrong amount/recipient/asset/
chain/nonce, expired, not-yet-valid, malformed signature).

## Config (env)

| Var | Purpose |
|---|---|
| `ARC_TESTNET_RPC_URL` | Arc RPC URL (default `https://rpc.testnet.arc.network`). |
| `ARC_CHAIN_ID` | chain id (default `5042002`). |
| `ARC_USDC_ADDRESS` | USDC ERC-20 address (default `0x3600…0000`, 6 decimals). |
| `X402_FORCE_MOCK` | force mock signing/verification (CI/tests). |

## UNVERIFIED (per skills)

- **Circle Gateway / x402 facilitator**: endpoint URLs, facilitator address, and
  any Gateway batch-settlement API are NOT in the docs (404). This package settles
  via the token's own `transferWithAuthorization` and does not call a facilitator.
- **USDC EIP-712 domain on Arc**: `name="USD Coin"`, `version="2"` are the common
  Circle USDC values but are UNVERIFIED for Arc — override via the asset if the
  on-chain domain differs (a wrong domain makes real signatures unrecoverable).

## Tests

`pnpm --filter @actflow/integrations-x402 test` (tsc then `node --test`), all
offline/mock — NO live Arc calls:

- 402 challenge construction units,
- EIP-3009 typed-data assembly + signing (mock + a real viem signer),
- `verifyPayment` accept (mock) and reject (wrong amount/recipient/asset/chain/
  nonce/expired/malformed-sig), plus a real recover-and-settle path with a stub
  settler.
