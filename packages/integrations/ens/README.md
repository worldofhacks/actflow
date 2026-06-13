# @actflow/integrations-ens

ENS identity for ActFlow agents. viem-based; **no hard-coded ENS names, contract
addresses, or chain IDs** — everything is driven by env/config.

Built strictly to `.claude/skills/ens-agents/SKILL.md` (distilled + verified from
the official ENS docs). Values the skill marked UNVERIFIED are config-driven with
a TODO and are never hard-coded guesses.

## What it does

- **Subname minting** via Name Wrapper `setSubnodeRecord` (`fuses=0` per skill).
- **ENSIP-26** agent text records (`agent-context`, `agent-endpoint[<protocol>]`).
- **ENSIP-25** registry attestation (`agent-registration[<erc7930-registry>][<agentId>]`).
- **Common ENSIP-5 records** (`description`, `url`, `avatar`).
- **Forward / reverse resolution** (reverse is forward-verified per the skill's
  anti-spoofing rule).
- **Pure encode/decode** of an `AgentProfile` <-> text-record pairs (unit-tested core).

## Config (env)

| Var | Purpose |
|---|---|
| `ENS_PARENT_NAME` | parent name that owns `agent.<name>.eth` subnames (e.g. `actflow.eth`). Required for writes. |
| `ENS_CHAIN` | `sepolia` (default) or `mainnet`. Chain id is taken from `viem/chains`, never hard-coded. |
| `MAINNET_RPC_URL` / `SEPOLIA_RPC_URL` | RPC endpoints. Falls back to viem's public RPC (reads only). |
| `ENS_<CONTRACT>_<NETWORK>` | optional per-contract address override (e.g. `ENS_NAME_WRAPPER_SEPOLIA`). Defaults are the skill's deployment table. |
| `ENS_KEY_CAPABILITIES` / `ENS_KEY_X402` / `ENS_KEY_PRICING` | override the **UNVERIFIED** custom record keys (no ENSIP defines these). |

Wallet keys are **never** read by this library — write functions take a viem
`WalletClient` (caller supplies a funded account, e.g. the Privy server wallet).

## UNVERIFIED items (per skill) — carried as TODOs

- No ENSIP defines agent **capabilities/topics**, an **x402** flag, or **pricing**
  text records. We expose them under configurable, collision-avoiding custom keys
  (default prefix `actflow.`). Confirm canonical keys before relying on interop.
- Subname `expiry=0` behavior is UNVERIFIED; `mintSubname` defaults to `0n` but
  accepts an `expiry` param (the gated test reads `ENS_TEST_EXPIRY`).
- The ENSIP-25 ERC-7930 interoperable address must be precomputed for your
  registry/chain; this library does not invent the encoding — pass it in.

## Tests

`pnpm --filter @actflow/integrations-ens test` (tsc then `node --test`):

- **unit** — encode/decode round-trip, namehash vectors, config resolution.
- **live** — resolves `vitalik.eth` against mainnet (skips if offline).
- **gated** — Sepolia mint; runs only when `SEPOLIA_RPC_URL` +
  `DEPLOYER_PRIVATE_KEY` + `ENS_PARENT_NAME` are set; otherwise skips. CI passes
  without funds.
