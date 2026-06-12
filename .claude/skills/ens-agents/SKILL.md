---
name: ens-agents
description: ENS identity for AI agents — ENSIP-25 registry verification, ENSIP-26 agent text records, Name Wrapper subname minting, text records, forward/reverse resolution with viem. Use when giving ActFlow agents ENS subname identities, verifying ERC-8004 agent registrations against ENS, or reading/writing agent records.
---

# ENS for AI Agents (ActFlow)

ActFlow agents get a subname under the parent ENS name (e.g. `agent1.actflow.eth`), publish
ENSIP-26 `agent-context` / `agent-endpoint[...]` records for discovery (Mastra A2A/MCP endpoints),
and an ENSIP-25 `agent-registration[...]` record binding the name to their ERC-8004 registry entry
(the same registry queried via BigQuery for reputation). The agent's Privy wallet is set as subname
owner; payments (x402 USDC on Arc) are out of scope here.

## Setup & Auth

No API keys needed — ENS is on-chain. You need an RPC endpoint and the key that owns/manages the
WRAPPED parent name.

```bash
pnpm add viem          # library listed under Tools & Libraries (docs.ens.domains/building-with-ai, links viem.sh); npm name `viem`
pnpm add wagmi         # only for React hooks (useEnsText/useEnsName/useEnsAddress) — named on docs.ens.domains/web/records
# "ENSjs" is named in docs without an npm package name — npm name UNVERIFIED, confirm before installing
```

```bash
export RPC_URL=https://...      # mainnet or Sepolia RPC
export PRIVATE_KEY=0x...        # owner/manager of the wrapped parent name (can be the Privy server wallet key)
```

LLM-context helpers (from https://docs.ens.domains/building-with-ai):
- `https://docs.ens.domains/llms.txt` (concise) and `/llms-full.txt` (complete, for RAG)
- Context7 MCP install (verbatim): `claude mcp add context7 -- npx -y @upstash/context7-mcp`

## Core API

### ENSIP-25 — AI Agent Registry ENS Name Verification (Draft) — https://docs.ens.domains/ensip/25/
One parameterized text record key:
```
agent-registration[<registry>][<agentId>]
```
- `<registry>` = **ERC-7930 interoperable address** of the registry contract (hex, `0x` prefix) — NOT the bare 20-byte address
- `<agentId>` = registry-defined agent identifier (string); MUST NOT contain `[` or `]`
- Value: any non-empty string passes; implementations should use `"1"`
- Verification flow: get (name, agentId, registry) from the agent registry → construct key → resolve
  text record on the claimed name → non-empty value = verified

Doc example (ERC-8004 registry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` on mainnet, agent `167`):
```
agent-registration[0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432][167]
```

### ENSIP-26 — Agent Text Records (Draft) — https://docs.ens.domains/ensip/26/
Two keys, written/read via ENSIP-5 `text(bytes32,string)`:
- `agent-context` — describes the agent; any agent-suitable format (plain text, Markdown, YAML, JSON)
- `agent-endpoint[<protocol>]` — URL of a protocol-specific endpoint; protocols: `mcp`, `a2a`, `web`
  (and future). Value must be a valid URL, including IPFS URIs (e.g. `ipfs://{cid}`)

Resolution: load `agent-context` → read how to interact → optionally load `agent-endpoint[<protocol>]`.

### Name Wrapper (subname minting) — https://docs.ens.domains/wrapper/contracts
Signatures verbatim from docs (parent must be wrapped; caller must own/operate parent):
```solidity
NameWrapper.setSubnodeOwner(bytes32 parentNode, string label, address owner, uint32 fuses, uint64 expiry)
NameWrapper.setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry)
NameWrapper.setFuses(bytes32 node, uint16 ownerControlledFuses)
NameWrapper.setChildFuses(bytes32 parentNode, bytes32 labelhash, uint32 fuses, uint64 expiry)
NameWrapper.wrap(bytes name, address wrappedOwner, address resolver)
NameWrapper.wrapETH2LD(string label, address wrappedOwner, uint16 ownerControlledFuses, address resolver)
NameWrapper.unwrap(bytes32 parentNode, bytes32 labelhash, address controller)
NameWrapper.unwrapETH2LD(bytes32 labelhash, address registrant, address controller)
```
Fuses (names from https://docs.ens.domains/wrapper/fuses — numeric values NOT on that page):
- Parent-controlled: `PARENT_CANNOT_CONTROL` (emancipates child), `IS_DOT_ETH` (internal), `CAN_EXTEND_EXPIRY`, +13 custom
- Owner-controlled: `CANNOT_UNWRAP` (Locks name), `CANNOT_BURN_FUSES`, `CANNOT_TRANSFER`, `CANNOT_SET_RESOLVER`,
  `CANNOT_SET_TTL`, `CANNOT_CREATE_SUBDOMAIN`, `CANNOT_APPROVE`, +9 custom
- Burning rules (verbatim): "To burn owner-controlled or subname fuses, CU must be burned. To burn CU,
  PCC must be burned." Parent must be Locked before burning `PARENT_CANNOT_CONTROL` on child names.

### Resolver records — https://docs.ens.domains/resolvers/interacting
```solidity
function setText(bytes32 node, string calldata key, string calldata value) external;
```
Read via ENSIP-5 `text(bytes32,string)` (returns the string value). Only the **Manager** of a name can
set records — for wrapped names (all ActFlow subnames) that's `ownerOf()` on the Name Wrapper; for
unwrapped names, `owner()` on the ENS Registry. Check `supportsInterface` (EIP-165) on the resolver before writing.

### Name processing (viem) — https://docs.ens.domains/resolution/names
```js
import { namehash, normalize } from 'viem/ens'   // normalize = ENSIP-15; ALWAYS normalize first
const node = namehash(normalize('name.eth'))
import { labelhash } from 'viem/ens'             // keccak-256 of a single label
import { packetToBytes } from 'viem/ens'         // DNS encoding
import { toHex } from 'viem/utils'
const dnsEncodedName = toHex(packetToBytes('name.eth'))
```
Root node = `0x0000000000000000000000000000000000000000000000000000000000000000`.

### Forward / reverse resolution (wagmi hooks shown in docs)
```js
import { useEnsText } from 'wagmi'      // { name: normalize('nick.eth'), key: 'com.twitter' }  — /web/records
import { useEnsAddress } from 'wagmi'   // forward: name -> address (example uses chainId: 1)   — /web/resolution
import { useEnsName } from 'wagmi'      // reverse: address -> primary name                     — /web/reverse
```
Setting a primary name: set the address record, then call `setName()` on the Reverse Registrar
(exact `setName` signature NOT detailed in fetched docs — verify before use).
Common text keys (from /web/records): `avatar`, `description`, `url`, `header`, `com.twitter`,
`com.github`; custom keys allowed — use collision-avoiding prefixes (e.g. `com.discord`).

## Addresses & Chain Config

All from https://docs.ens.domains/learn/deployments unless noted.

| Contract | Ethereum Mainnet | Sepolia |
|---|---|---|
| ENS Registry | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` |
| Name Wrapper | `0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401` | `0x0635513f179D50A207757E05759CbD106d7dFcE8` |
| Public Resolver | `0xF29100983E058B709F3D539b0c765937B804AC15` | `0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5` |
| Universal Resolver | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` |
| ETH Registrar Controller | `0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547` | `0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968` |
| L1 Reverse Registrar | `0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb` | `0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6` |

- ERC-8004 Identity Registry (mainnet): `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` — appears in the
  https://docs.ens.domains/ensip/25/ example AND independently confirmed: Etherscan labels this address
  "8004: Identity Registry" and it matches the official erc-8004/erc-8004-contracts repo (same address
  across mainnets incl. Base/Polygon). Safe to filter logs on it in the BigQuery reputation queries.
- Mainnet chain ID `1` appears in docs examples (https://docs.ens.domains/web/resolution). Sepolia
  chain ID: NOT FOUND IN DOCS — use `sepolia` from `viem/chains` instead of hard-coding
- Numeric fuse constant values: NOT FOUND IN DOCS — verify before use (read from NameWrapper contract
  or ENSjs constants); only fuse *names* are documented

## Gotchas

- **Always `normalize()` (ENSIP-15) before `namehash()`** — prevents zero-width/confusable spoofing;
  `NaMe.EtH` → `name.eth`. Unnormalized names hash to different nodes.
- **ENSIP-25 key embeds the ERC-7930 interoperable address**, not the bare contract address: mainnet
  registry `0x8004A169...a432` appears in the key as `0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432`
  (lowercase, chain-scoped encoding). Building the key with the bare address fails verification.
  ENSIP-25 does not explain ERC-7930 encoding — read that ERC separately.
- ENSIP-25 `agentId` must not contain `[` or `]`; value should be `"1"` (any non-empty passes).
- **Reverse resolution must be verified**: after getting a primary name from an address, forward-resolve
  it and confirm it returns the original address — docs call this out to prevent spoofing. Do this
  before trusting any agent's displayed ENS name in the marketplace.
- Wrapper subname functions take the **label as a string** (`"agent1"`, hashed internally);
  unwrap/setChildFuses take a `bytes32 labelhash`. Mixing these up reverts.
- Fuse burning order is strict (CU before owner/subname fuses; PCC before CU; parent Locked first).
  For the hackathon, mint with `fuses = 0` unless you need trustless subnames.
- Expiry semantics live at /wrapper/expiry (NOT fetched). Behavior of `expiry = 0` on subnames is
  UNVERIFIED — test mint + resolve on Sepolia before the demo. Passing a far-future expiry is
  reportedly capped to the parent's expiry by the wrapper (UNVERIFIED — from contract source, not docs).
- Only the **Manager** of a name can `setText`; if the Privy agent wallet owns the subname, IT must
  send the setText tx (or do all record-setting in the same `setSubnodeRecord` flow before transferring).
- Don't hardcode the Public Resolver for **reads** — names may use older/custom resolvers. Look up the
  name's actual resolver (registry / Universal Resolver). Hardcoding is fine for records you set yourself.
- ENSIP-25 and ENSIP-26 are both **Draft** status — key formats may change; pin behavior to the spec text above.
- ENSv2 migration is coming — check https://docs.ens.domains/web/ensv2-readiness before relying on
  registry-level assumptions long-term.

## Minimal Working Example

Mint `agent1.actflow.eth` on Sepolia, set ENSIP-26 + ENSIP-25 records, read back. Parent must already
be a **wrapped** name owned by `PRIVATE_KEY`.

```ts
// pnpm add viem  |  RPC_URL, PRIVATE_KEY env vars set
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { namehash, normalize } from 'viem/ens'

// Sepolia addresses — https://docs.ens.domains/learn/deployments
const NAME_WRAPPER = '0x0635513f179D50A207757E05759CbD106d7dFcE8'
const PUBLIC_RESOLVER = '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5'

const wrapperAbi = parseAbi([
  // signature verbatim from https://docs.ens.domains/wrapper/contracts
  'function setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry)',
])
const resolverAbi = parseAbi([
  'function setText(bytes32 node, string key, string value)', // docs.ens.domains/resolvers/interacting
  'function text(bytes32 node, string key) view returns (string)', // ENSIP-5 text(bytes32,string)
])

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)
const wallet = createWalletClient({ account, chain: sepolia, transport: http(process.env.RPC_URL) })
const client = createPublicClient({ chain: sepolia, transport: http(process.env.RPC_URL) })

const parent = normalize('actflow.eth')
const label = 'agent1'
const node = namehash(normalize(`${label}.${parent}`))

async function main() {
  // 1) Mint subname to the agent's Privy wallet address (here: ourselves), with resolver, no fuses.
  //    expiry=0 behavior UNVERIFIED (see Gotchas) — if resolution fails, retry with a far-future uint64.
  let hash = await wallet.writeContract({
    address: NAME_WRAPPER, abi: wrapperAbi, functionName: 'setSubnodeRecord',
    args: [namehash(parent), label, account.address, PUBLIC_RESOLVER, 0n, 0, 0n],
  })
  await client.waitForTransactionReceipt({ hash })

  // 2) ENSIP-26 discovery records + ENSIP-25 registry attestation
  const records: [string, string][] = [
    ['agent-context', 'ActFlow research agent. ERC-8004 reputation; hire per-task via x402 USDC on Arc.'],
    ['agent-endpoint[a2a]', 'https://agents.actflow.example/agent1/a2a'],       // Mastra A2A endpoint
    ['agent-endpoint[mcp]', 'https://agents.actflow.example/agent1/mcp'],
    // key = agent-registration[<ERC-7930 registry addr>][<agentId>], value "1" (ENSIP-25).
    // Registry encoding below is the MAINNET example from the spec — recompute for your registry/chain.
    ['agent-registration[0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432][167]', '1'],
  ]
  for (const [key, value] of records) {
    hash = await wallet.writeContract({
      address: PUBLIC_RESOLVER, abi: resolverAbi, functionName: 'setText', args: [node, key, value],
    })
    await client.waitForTransactionReceipt({ hash })
  }

  // 3) Read back (what the marketplace UI / hiring flow does)
  for (const key of ['agent-context', 'agent-endpoint[a2a]']) {
    console.log(key, '=>', await client.readContract({
      address: PUBLIC_RESOLVER, abi: resolverAbi, functionName: 'text', args: [node, key],
    }))
  }
}
main()
```

## Sources

- https://docs.ens.domains/ensip/25/ — fetched 2026-06-12 (ENSIP-25 key format, verification flow, ERC-8004 example)
- https://docs.ens.domains/ensip/26/ — fetched 2026-06-12 (agent-context, agent-endpoint[<protocol>])
- https://docs.ens.domains/building-with-ai — fetched 2026-06-12 (llms.txt, Context7 MCP, library names)
- https://docs.ens.domains/learn/deployments — fetched 2026-06-12 (all contract addresses above)
- https://docs.ens.domains/wrapper/overview — fetched 2026-06-12 (wrapper concept, fuse categories)
- https://docs.ens.domains/wrapper/contracts — fetched 2026-06-12 (function signatures)
- https://docs.ens.domains/wrapper/fuses — fetched 2026-06-12 (fuse names + burning rules; no numeric values)
- https://docs.ens.domains/resolvers/interacting — fetched 2026-06-12 (setText, Manager rule)
- https://docs.ens.domains/web/records — fetched 2026-06-12 (useEnsText, common keys, custom-key prefixes)
- https://docs.ens.domains/web/resolution — fetched 2026-06-12 (forward lookup, multichain coin types)
- https://docs.ens.domains/web/reverse — fetched 2026-06-12 (useEnsName, forward-verification warning, setName flow)
- https://docs.ens.domains/resolution/names — fetched 2026-06-12 (normalize/namehash/labelhash/packetToBytes examples)
- https://etherscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 — fetched 2026-06-12 (cross-check: labeled "8004: Identity Registry")
- https://github.com/erc-8004/erc-8004-contracts — fetched 2026-06-12 (cross-check: official ERC-8004 registry contracts, same address across mainnets)
