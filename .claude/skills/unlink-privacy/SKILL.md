---
name: unlink-privacy
description: Unlink privacy SDK (@unlink-xyz/sdk) for private balances and shielded USDC payouts — deposit/transfer/withdraw/execute on Arc Testnet, Base Sepolia, Ethereum Sepolia, Monad Testnet. Use when adding optional Unlink private payouts to ActFlow agents, hiding agent earnings/payment amounts, or wiring private transfers on Circle's Arc chain.
---

# Unlink Privacy SDK

Unlink = "Build private applications on blockchains." Private blockchain accounts that own,
send, receive, and call contracts "without exposing balances, tokens, amounts or transaction
history." Internally: "Balances inside the contract are held as a set of encrypted UTXO notes,
and every private operation is proven with a Groth16 zero-knowledge proof."

ActFlow fit: agent earns x402 USDC on Arc → deposits into Unlink private balance →
private transfer to the agent owner's `unlink1...` address (amount/parties hidden) →
withdraw to a public EVM address only when cashing out.

## Setup & Auth

```bash
# Package is published on the `canary` npm dist-tag:
pnpm add @unlink-xyz/sdk@canary
# (also: npm install / yarn add / bun add @unlink-xyz/sdk@canary)
```

Subpath imports by environment:
- `@unlink-xyz/sdk/browser` — "Non-custodial browser apps" (e.g. MetaMask)
- `@unlink-xyz/sdk/client` — "Custodial servers, CLIs, workers, and agents" (also exports `createUnlinkClient`)
- `@unlink-xyz/sdk/admin` — "Backend for registration, authorization tokens, and backend reads" (API-key admin client)

Env vars:
- `UNLINK_API_KEY` — backend-only API key. Never expose to browser bundles.
  Obtain: sign in at dashboard.unlink.xyz → create organization/project → API Keys page →
  generate key, store in backend env.

**Browser (non-custodial) init:**
```ts
import { account, createUnlinkClient } from "@unlink-xyz/sdk/browser";

const { account: unlinkAccount } = await account.fromMetaMask({
  provider: window.ethereum,
  appId: "your-app-id",
  chainId: 84532, // must match the environment's chain
});

const client = createUnlinkClient({
  environment: "base-sepolia",
  account: unlinkAccount,
});

await client.ensureRegistered();
```

**Server (custodial) init — the pattern for ActFlow agent wallets:**
```ts
import { createUnlinkAdmin } from "@unlink-xyz/sdk/admin";
import { account, createUnlinkClient } from "@unlink-xyz/sdk/client";

const admin = createUnlinkAdmin({
  environment: "base-sepolia",
  apiKey: process.env.UNLINK_API_KEY!,
});

const unlinkAccount = account.fromMnemonic({ mnemonic });
const unlinkAddress = await unlinkAccount.getAddress();

const client = createUnlinkClient({
  environment: "base-sepolia",
  account: unlinkAccount,
  register: (payload) => admin.users.register(payload),
  authorizationToken: {
    provider: () => admin.authorizationTokens.issue({ unlinkAddress }),
  },
});
```
No Privy account adapter is documented; only `account.fromMetaMask`, `account.fromMnemonic`,
and `fromKeys` appear in docs. For Privy server wallets, derive/store a mnemonic per agent
and use the custodial pattern (UNVERIFIED integration — adapt and test).

## Core API

All write methods return a `TransactionHandle`: `{ txId, status, txHash, wait() }`.
Terminal statuses: `"processed"` | `"failed"`.

**Deposit (public → private). "A deposit's amount, token, and source wallet are public";
user pays native gas.**
```ts
// Recommended: handles ERC-20 approval for you
const tx = await client.depositWithApproval({
  token: "0xTokenAddress",          // required, ERC-20 address
  amount: "1000000000000000000",    // required, wei (decimal string)
  // optional: deadline, nonce, evm, waitForApproval
});
const confirmed = await tx.wait();  // "processed" | "failed"

// Lower-level — "Use deposit() directly only when the token is already approved
// or when you want raw control over the approval flow."
await (await client.deposit({ token: "0xTokenAddress", amount: "1000000000000000000" })).wait();

// Approval helpers:
// ensureErc20Approval()  — returns { status: "submitted" | "already-approved", txHash? }
// getApprovalState()     — returns { isApproved: boolean }
// buildApprovalTx()      — returns { to: string; data: string; value?: bigint }
```

**Transfer (private → private). "Sender, recipient, and amount are all hidden by a
zero-knowledge proof." Token type is hidden too. Submitted by Unlink's relayer.**
```ts
// Single recipient
const tx = await client.transfer({
  recipientAddress: "unlink1...",   // destination Unlink address
  token: "0xTokenAddress",          // ERC-20 contract address
  amount: "500000000000000000",     // smallest unit, decimal string
});

// Multiple recipients
await client.transfer({
  token: "0xTokenAddress",
  transfers: [{ recipientAddress: "unlink1...", amount: "..." }, /* ... */],
});
// "The transfer() method signs with the spending key from the account bound to createUnlinkClient."
```

**Withdraw (private → public). Destination + amount are public; "the source private
account is not." Submitted by Unlink's relayer.**
```ts
const tx = await client.withdraw({
  recipientEvmAddress: "0xRecipient",
  token: "0xTokenAddress",
  amount: "500000000000000000",
});
```

**Execute (private balance → arbitrary EVM calls).** "Take tokens from their private Unlink
balance, run one or more EVM calls from an ExecutionAccount, and optionally return tokens
privately." Gas via ERC-4337: "The SDK packages the batch as a UserOperation, and Unlink's
paymaster sponsors it." Atomic: "if one call reverts, the whole batch reverts."
```ts
const result = await client.execute({
  token,                       // required, ERC-20 address
  amount: amount.toString(),   // required, token base units
  calls: [approveCall, supplyCall], // required, 1–16 ordered EVM calls
  // optional: depositBack, allocationPolicy (default "first_unused"),
  //           accountIndex (required with "by_index" policy)
});
```

**Reading data:**
```ts
const { balances } = await client.getBalances();           // optional { token: "0x..." } filter
const { transactions } = await client.getTransactions({
  status: "processed", type: "transfer", limit: 20, cursor: "...", // all optional
});
await tx.wait({ intervalMs: 2000, timeoutMs: 60000, signal: ac.signal, onStatus: (s) => log(s) });
const result = await client.pollTransactionStatus(txId, { intervalMs: 2000, timeoutMs: 60000, signal: ac.signal });
// Admin reads: admin.users.get({ address }), admin.users.getBalances({ address }),
// admin.users.getTransactions({ address, type, status, limit }),
// admin.authorizationTokens.issue({ unlinkAddress, expiresInSeconds })
```

**Testnet faucet (SDK, testnet-only):**
```ts
const r1 = await client.faucet.requestTestTokens({   // mints ERC-20 to an EVM wallet
  token: testToken,                  // required
  evmAddress: "0xRecipient",         // optional; omitting requires an EVM provider
  amount: "1000000000000000000",     // optional; capped by faucet maximum
}); // FaucetMintResponse: { tx_hash: string }

const r2 = await client.faucet.requestPrivateTokens({ // shielded tokens into an Unlink account
  token: testToken,                  // required
  unlinkAddress: "unlink1...",       // optional; auto-registers the caller if omitted
  amount: "1000000000000000000",     // optional; capped by faucet maximum
}); // FaucetTransferResponse: { tx_id: string; status: string }
```

## Addresses & Chain Config

Environments (https://docs.unlink.xyz/supported-chains.md):

| `environment` value | Network | Chain ID | Status |
|---|---|---|---|
| `arc-testnet` | Arc Testnet | 5042002 | Available |
| `base-sepolia` | Base Sepolia | 84532 | Available |
| `ethereum-sepolia` | Ethereum Sepolia | 11155111 | Available |
| `monad-testnet` | Monad Testnet | 10143 | Available |

- Arc Testnet gas: "USDC as its native gas token" (via Circle faucet) — https://docs.unlink.xyz/supported-chains.md
- Base Sepolia gas: ETH (via Alchemy faucet) — https://docs.unlink.xyz/supported-chains.md
- Unlink contract addresses: NOT FOUND IN DOCS — verify before use.
- Test token / USDC token addresses per chain: NOT FOUND IN DOCS — verify before use
  (docs use `"0xTokenAddress"` / `testToken` placeholders only).
- Private address format: `unlink1...` — https://docs.unlink.xyz/transfer.md

## Gotchas

- Install from the **`canary` dist-tag** (`@unlink-xyz/sdk@canary`); a plain install gets a
  stale `latest` (verified on npm 2026-06-12: `latest` = 0.0.2-canary.0 vs `canary` =
  0.3.0-canary.598). Expect breaking changes between canary versions.
- `amount` is always a **decimal string in the token's smallest unit** (docs call it "wei";
  examples use 18 decimals: `"1000000000000000000"` = 1 token). USDC is typically 6 decimals
  (UNVERIFIED for Unlink's Arc test token) — confirm with `client.getBalances()` before
  hard-coding conversions.
- The chain ID used for account derivation "must correspond to the selected environment's
  chain — mismatched IDs produce different accounts" (applies to `account.fromMetaMask`).
- Gas asymmetry: **deposits require the user's native gas** ("A deposit is a normal on-chain
  transaction sent from the user's EVM wallet, so that wallet needs native gas"); "Transfers
  and withdrawals are submitted by Unlink's relayer"; `execute()` is paymaster-sponsored.
  On `arc-testnet` deposit gas is USDC itself. Whether the relayer charges a fee is not
  stated in docs.
- "Only transfers between `unlink1` accounts hide all four properties" — sender / recipient /
  amount / token. Deposits expose source wallet + amount + token; withdrawals expose
  destination + amount. Don't deposit and withdraw identical amounts back-to-back if
  linkability matters.
- "The `execute()` method requires a seed-backed account. `fromKeys` can transfer and
  withdraw but cannot execute."
- Faucet: "The faucet `tx_id` is scoped to the faucet and cannot be polled via"
  `pollTransactionStatus` — confirm receipt with `getBalances()` instead. Amounts capped by
  faucet maximum (cap value NOT FOUND IN DOCS).
- `wait()`/polling "throws `TimeoutError` if the timeout elapses before a terminal status" —
  wrap in try/catch; the tx may still land after a timeout.
- Protocol fee schedule: NOT FOUND IN DOCS — verify before use.

## Minimal Working Example

```ts
// agent-private-payout.ts — deposit → private transfer → withdraw on Arc Testnet
import { createUnlinkAdmin } from "@unlink-xyz/sdk/admin";
import { account, createUnlinkClient } from "@unlink-xyz/sdk/client";

const TOKEN = process.env.UNLINK_TEST_TOKEN!; // token address NOT FOUND IN DOCS — supply via env
const OWNER_UNLINK_ADDR = process.env.OWNER_UNLINK_ADDR!;   // "unlink1..."
const CASHOUT_EVM_ADDR = process.env.CASHOUT_EVM_ADDR!;     // "0x..."

async function main() {
  const admin = createUnlinkAdmin({
    environment: "arc-testnet",            // chainId 5042002
    apiKey: process.env.UNLINK_API_KEY!,
  });

  const unlinkAccount = account.fromMnemonic({ mnemonic: process.env.AGENT_MNEMONIC! });
  const unlinkAddress = await unlinkAccount.getAddress();

  const client = createUnlinkClient({
    environment: "arc-testnet",
    account: unlinkAccount,
    register: (payload) => admin.users.register(payload),
    authorizationToken: {
      provider: () => admin.authorizationTokens.issue({ unlinkAddress }),
    },
  });
  await client.ensureRegistered();

  // 1) Shield the agent's x402 USDC earnings (public: funder + amount; agent pays gas)
  const dep = await client.depositWithApproval({ token: TOKEN, amount: "1000000" });
  console.log("deposit:", (await dep.wait()).status);

  // 2) Private payout to the agent owner (sender, recipient, amount, token all hidden)
  const xfer = await client.transfer({
    recipientAddress: OWNER_UNLINK_ADDR,
    token: TOKEN,
    amount: "750000",
  });
  console.log("transfer:", (await xfer.wait()).status);

  // 3) Cash out the remainder to a public EVM address (destination + amount public)
  const wd = await client.withdraw({
    recipientEvmAddress: CASHOUT_EVM_ADDR,
    token: TOKEN,
    amount: "250000",
  });
  console.log("withdraw:", (await wd.wait()).status);

  console.log(await client.getBalances({ token: TOKEN }));
}

main().catch(console.error);
```
Amounts above assume 6-decimal USDC (UNVERIFIED — check the test token's decimals first).

## Sources

- https://docs.unlink.xyz — fetched 2026-06-12 (overview, package subpaths, init/auth)
- https://docs.unlink.xyz/llms.txt — fetched 2026-06-12 (site map)
- https://docs.unlink.xyz/quickstart — fetched 2026-06-12 (install, env var, browser/server init, examples)
- https://docs.unlink.xyz/supported-chains.md — fetched 2026-06-12 (environments, chain IDs, gas tokens)
- https://docs.unlink.xyz/deposit.md — fetched 2026-06-12 (depositWithApproval/deposit, approval helpers)
- https://docs.unlink.xyz/transfer.md — fetched 2026-06-12 (transfer params, privacy guarantees, unlink1 format)
- https://docs.unlink.xyz/withdraw.md — fetched 2026-06-12 (withdraw params, visibility notes)
- https://docs.unlink.xyz/execute.md — fetched 2026-06-12 (execute params, ERC-4337 sponsorship, limits)
- https://docs.unlink.xyz/faucet.md — fetched 2026-06-12 (faucet methods, response types)
- https://docs.unlink.xyz/reading-data.md — fetched 2026-06-12 (getBalances, getTransactions, TransactionHandle, admin reads)
- https://docs.unlink.xyz/how-unlink-works.md — fetched 2026-06-12 (UTXO notes, Groth16, relayer/gas model)
