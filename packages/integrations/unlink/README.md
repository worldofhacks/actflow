# @actflow/integrations-unlink

Private agent payouts for ActFlow via the [Unlink](https://docs.unlink.xyz)
privacy SDK (`@unlink-xyz/sdk`). Routes an agent's earnings — the marketplace
`withdraw()` proceeds — through Unlink so the **payout amount and parties are
shielded**: `deposit()` into a private balance, private `transfer()` to the
owner's `unlink1…` address, optional `withdraw()` to a public EVM address.

Built to `.claude/skills/unlink-privacy/SKILL.md` (server/custodial pattern:
`account.fromMnemonic` + `createUnlinkAdmin` + `createUnlinkClient`) and mirrors
the sibling `@actflow/integrations-privy` package (ESM, `tsc`, `node:test`, mock
mode). **No hard-coded secrets/addresses**; chain id / token are env-driven (Arc
testnet USDC default is the cited `@actflow/sdk` constant).

## Architecture

Depends only on `@actflow/sdk` (a dependency-free leaf, for the Arc chain
config). It **does not** depend on `@actflow/agents` — `@actflow/agents` depends
on *this* package (one direction only), so there is no dependency cycle.

## Modes

| Mode | When | Behavior |
|---|---|---|
| `live` | `UNLINK_API_KEY` **and** `UNLINK_MNEMONIC` set (and `UNLINK_FORCE_MOCK` unset) **and** `@unlink-xyz/sdk` loads | Builds an admin + custodial client on the configured environment (Arc Testnet by default) and calls the real `depositWithApproval` / `transfer` / `withdraw`. |
| `mock` | creds absent, `UNLINK_FORCE_MOCK=1`, **or** the optional SDK can't load | Deterministic, clearly-labeled receipts (`mock: true`, `status: "mock-processed"`, `txHash: null`). No account/API key/funds needed. |

The mock path means build + tests pass with **no creds and no network**. Mock
receipts are never presented as real: the `mock: true` flag and the `mock-…`
`txId` prefix make them unmistakable.

## API

```ts
import { createUnlinkPayout } from "@actflow/integrations-unlink";

const payout = createUnlinkPayout(); // reads env; Arc Testnet default

// 1) Shield the agent's withdraw() proceeds into a private balance.
await payout.privateDeposit({ amount: "1000000" }); // base units (USDC = 6dp)

// 2) Private transfer to the owner's unlink1… address (amount/parties hidden).
await payout.privateTransfer({
  toUnlinkAddress: "unlink1…",
  amount: "750000",
});

// 3) Optional cash-out to a public EVM address.
await payout.privateWithdraw({
  toEvmAddress: "0x…",
  amount: "250000",
});
```

Every method returns an `UnlinkReceipt`:
`{ op, txId, status, txHash, mock? }`. Amounts are **decimal strings in the
token's smallest unit** (the SDK's "wei"); Arc USDC is 6 decimals, so `"1000000"`
= 1 USDC.

## Config (env)

| Var | Purpose |
|---|---|
| `UNLINK_API_KEY` | Unlink backend API key (secret — enables live mode). |
| `UNLINK_MNEMONIC` | BIP-39 mnemonic for the agent's Unlink account (secret — enables live mode). |
| `UNLINK_CHAIN_ID` | target chain id; mapped to an Unlink `environment` (default `5042002` = Arc Testnet → `arc-testnet`). Also supports `84532` (base-sepolia), `11155111` (ethereum-sepolia), `10143` (monad-testnet). |
| `UNLINK_TOKEN` | ERC-20 token address to shield (default Arc USDC `0x3600…0000` from `@actflow/sdk`). |
| `UNLINK_ACCOUNT_INDEX` | optional `account.fromMnemonic` derivation index. |
| `UNLINK_FORCE_MOCK` | force mock mode even when creds are present (CI/tests). |

## Live status

`@unlink-xyz/sdk@canary` (**0.3.0-canary.598**) installs and imports cleanly, and
the live code path is **verified up to the network boundary**: the dynamic import
of `/client` + `/admin`, `account.fromMnemonic` (derives a real `unlink1…`
address), `createUnlinkAdmin`, and `createUnlinkClient` all succeed and the
`ensureRegistered`/`depositWithApproval`/`transfer`/`withdraw` methods are
present. A real end-to-end private transfer additionally needs a provisioned
`UNLINK_API_KEY`, a funded account, and (for deposits) native gas on the chain —
on Arc Testnet that gas is USDC itself (Circle faucet).

The SDK is an **optional** dependency loaded by dynamic import; if it is absent
or fails to load, the wrapper transparently downgrades to mock mode rather than
throwing. Per the unlink-privacy SKILL, the `canary` dist-tag may introduce
breaking changes between versions; the structural types in `client.ts` are
pinned to 0.3.0-canary.598.

## Tests

`pnpm --filter @actflow/integrations-unlink test` (tsc then `node --test`),
all offline/mock — **24 tests**:

- config resolution + the secret-gated live/mock decision + chain→environment
  mapping (`config.test.ts`),
- mock-mode `deposit`/`transfer`/`withdraw` receipts + the full sequence +
  deterministic ids (`payout.test.ts`),
- input validation: bad amounts, non-`unlink1` recipients, non-EVM
  destinations (`validation.test.ts`).

No live Unlink/network calls are made in the test suite.
