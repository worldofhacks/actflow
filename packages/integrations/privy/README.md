# @actflow/integrations-privy

Privy server-wallet provider for ActFlow agents. Implements the agents'
`IWalletProvider` (`getAddress` / `getBalance` / `pay`) backed by
[Privy server wallets](https://docs.privy.io/) on Circle's **Arc testnet**, with
a deterministic, clearly-labeled **MOCK mode** so build + tests pass with no
Privy account and no funds.

Built to `.claude/skills/privy-agent-wallets/SKILL.md` (server SDK path,
`@privy-io/node@0.21.0`) and `.claude/skills/arc-circle/SKILL.md` (Arc chain +
USDC config). **No hard-coded secrets**; chain id / RPC / USDC address are
env-driven (Arc testnet values are cited skill constants, all overridable).

## Modes

| Mode | When | Behavior |
|---|---|---|
| `live` | `PRIVY_APP_ID` **and** `PRIVY_APP_SECRET` set (and `PRIVY_FORCE_MOCK` unset) | Creates/fetches a Privy server wallet, reads USDC balance over the Arc RPC, sends a USDC ERC-20 transfer via Privy `sendTransaction`. |
| `mock` | creds absent, or `PRIVY_FORCE_MOCK=1` | Deterministic in-memory wallet; every result tagged `mock: true`. No funds/creds needed. |

Live execution needs a funded Privy wallet + reachable Arc RPC; without them the
provider stays in mock mode. Mock results are **never** presented as real (the
`mock: true` flag is set on balances and payment results, and the CLI prints a
"not a real on-chain wallet" note).

## API

```ts
import { PrivyWalletProvider } from "@actflow/integrations-privy";

const wallet = new PrivyWalletProvider({ label: "swap-agent" });
await wallet.getAddress();              // 0x… (Privy wallet, or deterministic mock)
await wallet.getBalance("USDC");        // { symbol, amount, mock? }
await wallet.pay({ to: "0x…", amount: "0.05" }); // { txHash, mock? }
```

`PrivyWalletProvider implements IWalletProvider` from `@actflow/agents` — the
conformance test asserts this against the real interface.

## CLI (Privy Agent Wallet)

Provisions an agent wallet and prints its address (`bin: actflow-privy-wallet`):

```bash
actflow-privy-wallet --label swap-agent        # text output
actflow-privy-wallet --label swap-agent --json # JSON descriptor
```

In mock mode it derives a deterministic address tagged `mock:true`; in live mode
it creates/fetches the Privy server wallet. No secrets are printed.

## Config (env)

| Var | Purpose |
|---|---|
| `PRIVY_APP_ID`, `PRIVY_APP_SECRET` | Privy app credentials (secrets — enable live mode). |
| `PRIVY_AUTHORIZATION_KEY` | optional base64 PKCS8 P-256 authorization key for wallet actions. |
| `PRIVY_WALLET_ID` | optional — reuse an already-provisioned server wallet. |
| `PRIVY_FORCE_MOCK` | force mock mode even when creds are present (CI/tests). |
| `ARC_TESTNET_RPC_URL` | Arc RPC URL (default `https://rpc.testnet.arc.network`). |
| `ARC_CHAIN_ID` | chain id (default `5042002`). |
| `ARC_USDC_ADDRESS` | USDC ERC-20 address (default `0x3600…0000`, 6 decimals). |

## Notes / UNVERIFIED

- Arc native gas is USDC and is deducted automatically; live `pay` sends ERC-20
  `transfer` calldata via Privy. Privy's `caip2` is derived from `ARC_CHAIN_ID`;
  the Privy docs do not list an Arc CAIP-2 (skill: "NOT FOUND IN DOCS") — confirm
  Privy supports `eip155:5042002` before relying on the live path.
- `@privy-io/node` is imported dynamically so mock-only environments need no SDK.

## Tests

`pnpm --filter @actflow/integrations-privy test` (tsc then `node --test`), all
offline/mock:

- config resolution + the secret-gated live/mock decision,
- `IWalletProvider` conformance of the mock provider (against `@actflow/agents`),
- the CLI in mock mode.
