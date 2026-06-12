---
name: privy-agent-wallets
description: Privy agent wallets for Node/TS agents — server wallet API (create/sign/send EVM tx), agent CLI, agents.privy.io sandbox, authorization keys, policies, and the built-in x402 payment client. Use when an ActFlow agent process needs to hold a wallet, send an EVM transaction, or pay/receive x402-style USDC micropayments via Privy.
---

# Privy Agent Wallets

Two integration paths, both verified against official sources on 2026-06-12:

1. **Server SDK (`@privy-io/node`)** — your backend/Mastra agent process creates and drives wallets via app credentials. This is the path for ActFlow's autonomous agents (the docs' "agent-controlled wallets" model).
2. **Agent CLI (`@privy-io/agent-wallet-cli`)** — a human-authorized CLI session for an agent dev loop, backed by the agents.privy.io sandbox.

## Setup & Auth

```bash
npm install @privy-io/node        # server SDK; latest on npm: 0.21.0 (verified via npm registry 2026-06-12)
```

Credentials (from the Privy Dashboard):

| Item | How the SDK reads it |
|---|---|
| App ID | `new PrivyClient({appId})`; env default `PRIVY_APP_ID` (verified in @privy-io/node@0.21.0 type defs) |
| App secret | `new PrivyClient({appSecret})`; env default `PRIVY_APP_SECRET` |
| Authorization key | "Create authorization keys in the Privy Dashboard and securely store the corresponding private keys" (agentic-wallets recipe). Passed per-request as `authorization_context.authorization_private_keys` — "base64-encoded PKCS8-formatted private keys, with no PEM headers" (ECDSA P-256 signing, per SDK type docs) |

```ts
import {APIError, PrivyAPIError, PrivyClient} from '@privy-io/node';
const privy = new PrivyClient({appId: 'insert-your-app-id', appSecret: 'insert-your-app-secret'});
```
(verbatim from https://docs.privy.io/basics/nodeJS/quickstart)

REST auth (if not using the SDK): Basic auth `-u "<app-id>:<app-secret>"` plus headers `privy-app-id`, and for wallet actions `privy-authorization-signature` and `privy-request-expiry` ("A Unix timestamp in milliseconds"). "If you are using Privy's SDKs, the appropriate authorization signature and request expiry headers are added automatically." (api-reference/authorization-signatures)

### Agent CLI (sandbox path)

Package is **singular**: `@privy-io/agent-wallet-cli` (npm: 0.3.1). The agents.privy.io skill file says: "Never use `npx`" — invoke via:

```bash
pnpm --package=@privy-io/agent-wallet-cli dlx privy-agent-wallet login        # device-auth flow, browser sign-in
pnpm --package=@privy-io/agent-wallet-cli dlx privy-agent-wallet list-wallets # ETH + SOL addresses for the session
pnpm --package=@privy-io/agent-wallet-cli dlx privy-agent-wallet fund         # open sandbox onramp
pnpm --package=@privy-io/agent-wallet-cli dlx privy-agent-wallet rpc --json '<body>'
pnpm --package=@privy-io/agent-wallet-cli dlx privy-agent-wallet logout
```

Global install alternative (npm README): `pnpm add -g @privy-io/agent-wallet-cli`. Env var `PRIVY_AGENT_URL` overrides the agent server URL (`--api-url <url>` flag). Sandbox UI: https://agents.privy.io (wallets at `/`, agents at `/manage`). Sessions: the agent-cli recipe page says they "remain active for up to 30 days", while agents.privy.io/skill.md says the session auto-refreshes transparently until the refresh token is revoked — sources conflict; assume 30 days max. Stored in the system keychain on macOS/Linux (Linux needs `sudo apt install -y libsecret-tools`); falls back to an encrypted `~/.privy/session.json` on Windows or when no keychain is available.

CLI RPC methods — Ethereum: `personal_sign`, `eth_sendTransaction`, `eth_signTransaction`, `eth_signTypedData_v4`, `secp256k1_sign`, `eth_sign7702Authorization`, `eth_signUserOperation`. Solana: `signTransaction`, `signAndSendTransaction`, `signMessage`. Paid requests: `fetch-x402` (USDC on Base, EIP-712 signatures), `fetch-mpp` (stablecoins on Tempo). Both enforce a `--max-value` spending cap in token base units (default `1000000` = 1 USDC) and fail closed if the charge amount cannot be determined.

## Core API

All param/field names below are copied from docs or @privy-io/node@0.21.0 type definitions — note the **snake_case**.

**Create wallet** — `privy.wallets().create({chain_type, owner, policy_ids, additional_signers})`:

```ts
const {id, address, chain_type} = await privy.wallets().create({
  chain_type: 'ethereum',
  owner: {user_id: 'did:privy:xxxxx'}
});
```
REST: `POST https://api.privy.io/v1/wallets`, body `{"owner": {"user_id": "did:privy:xxxxxx"}, "chain_type": "ethereum"}`. Response fields: `id`, `address`, `chain_type`, `policy_ids`, `owner_id`, `additional_signers`, `created_at`, `external_id`, `display_name`. Supported `chain_type` (`WalletChainType` union in @privy-io/node@0.21.0): `ethereum`, `solana`, `cosmos`, `stellar`, `sui`, `aptos`, `movement`, `tron`, `bitcoin-segwit`, `bitcoin-taproot`, `pearl`, `near`, `ton`, `starknet`, `spark`.

For autonomous agents (agentic-wallets recipe): "Set the owner_id of the wallet to the id of the authorization key you created earlier" and "Set the policy_ids array of the wallet to a singleton containing the id of the policy you created earlier."

**Send EVM transaction** — `privy.wallets().ethereum().sendTransaction(walletId, {caip2, params, sponsor})`:

```ts
const {hash, caip2} = await privy.wallets().ethereum().sendTransaction('insert-wallet-id', {
  caip2: 'eip155:8453',
  params: {transaction: {to: '0x...', value: '0x2386F26FC10000', chain_id: 8453}},
  sponsor: true   // gas sponsorship
});
```
REST: `POST https://api.privy.io/v1/wallets/<wallet_id>/rpc`, body `{"method": "eth_sendTransaction", "caip2": "eip155:1", "params": {"transaction": {"to": "0x...", "value": "0x2386F26FC10000"}}, "sponsor": true}` → `{"method": "eth_sendTransaction", "data": {"hash": "<tx-hash>", "caip2": "eip155:1"}}`.

Other ethereum-service methods (verified in @privy-io/node@0.21.0 `public-api/services/ethereum.d.ts`): `signMessage(walletId, {message, ...})`, `signTransaction`, `signTypedData`, `signUserOperation`, `sign7702Authorization`, `signSecp256k1`, `sendCalls`. Wallet actions accept an `authorization_context` input field:

```ts
// AuthorizationContext (verbatim from @privy-io/node@0.21.0 lib/authorization.d.ts)
{ authorization_private_keys?: string[]; user_jwts?: string[]; signatures?: string[]; sign_fns?: SignFn[] }
```
Manual signing helpers exported from `@privy-io/node`: `formatRequestForAuthorizationSignature`, `generateAuthorizationSignature`, `generateAuthorizationSignatures`. Signature payload shape: `{version: 1, method: 'POST'|'PUT'|'PATCH'|'DELETE', url, body, headers: {'privy-app-id', 'privy-idempotency-key'?, 'privy-request-expiry'?}}` — "Signatures are not required on 'GET' requests."

**Policies** — `privy.policies().create(...)` / `privy.policies().createRule(policyId, ...)` (SDK type defs). Policy object (controls/policies/overview): `version` ("Currently \"1.0\" only"), `name`, `chain_type` (`'ethereum'`, `'solana'`, `'tron'`, `'sui'`), `rules[]`. Rule: `name`, `method` (e.g. `'eth_sendTransaction'`, `'eth_signTransaction'`, `'signTransaction'`, `'*'`), `conditions[]`, `action` (`'ALLOW'`|`'DENY'`). Condition: `field_source` (e.g. `'ethereum_transaction'`, `'ethereum_calldata'`, `'ethereum_typed_data_message'`, `'solana_program_instruction'`, `'action_request_body'` — non-exhaustive; docs also list typed-data-domain, 7702-authorization, Solana system/token program, Tron, Sui, Tempo, `system`, `reference` sources), `field`, `operator` (`'eq'`,`'neq'`,`'lt'`,`'lte'`,`'gt'`,`'gte'`,`'in'`,`'in_condition_set'` — docs list; note the `ConditionOperator` type in @privy-io/node@0.21.0 omits `'neq'`, so TS may reject it even where the API accepts it), `value`. If a request satisfies no rule, the policy engine defaults to `DENY`; if any rule evaluates to `DENY`, the request is denied (DENY takes precedence over ALLOW). Recipe-suggested agent constraints: transfer limits per tx/time window, allowlisted contracts, recipient restrictions.

**x402 payments (ActFlow per-task USDC)** — `createX402Client(client, {walletId, address, authorizationContext})` from `@privy-io/node/x402`, used with `wrapFetchWithPayment` from `@x402/fetch` (or `wrapAxiosWithPayment` from `@x402/axios`) to "automatically handle HTTP 402 Payment Required responses". Marked `@experimental` in the SDK. `@x402/fetch` / `@x402/axios` / `@x402/evm` are **optional peerDependencies** of `@privy-io/node` (`^2.3.0`; npm latest 2.15.0) — install them separately, they are not pulled in automatically.

## Addresses & Chain Config

- Privy API base URL: `https://api.privy.io` (production), `https://api.staging.privy.io` (staging) — @privy-io/node@0.21.0 `client.d.ts`
- CAIP-2 examples in docs: `eip155:1` (https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction), `eip155:8453` Base (same page), `eip155:11155111` Sepolia (https://docs.privy.io/basics/nodeJS/quickstart)
- Circle Arc chain ID / CAIP-2 for Arc: NOT FOUND IN DOCS — verify before use (Privy docs fetched here never mention Arc; confirm Arc's `eip155:<id>` from Circle docs before wiring ActFlow payouts)
- USDC token contract addresses (Base, Arc, or any chain): NOT FOUND IN DOCS — verify before use
- x402 facilitator/receiver addresses: NOT FOUND IN DOCS — verify before use (CLI only states `fetch-x402: USDC payments on Base`)

## Gotchas

- **Binary vs package vs npx**: package is `@privy-io/agent-wallet-cli` (singular "wallet"); the installed binaries are `privy-agent-wallet` and the alias `paw` (npm `bin` field). The docs recipe page renders commands as `privy-agent-wallets ...` (plural) and mentions `npx @privy-io/agent-wallet-cli login`, but agents.privy.io/skill.md explicitly says "Never use `npx`" and uses the `pnpm dlx` form — prefer the skill.md form.
- **Two SDKs exist**: `@privy-io/node` (current, Stainless-generated, used in docs quickstart) and the older `@privy-io/server-auth` (1.32.5 on npm). Don't mix them; method shapes differ.
- **snake_case everywhere** in `@privy-io/node` inputs/outputs: `chain_type`, `policy_ids`, `owner_id`, `authorization_context`, `chain_id` — not camelCase. The constructor options are camelCase (`appId`, `appSecret`).
- `transaction.value` is a **hex-encoded wei string** (`"0x2386F26FC10000"` = 0.01 ETH in docs examples); `chain_id` is a number and must match the `caip2` string. USDC transfers are ERC-20 calldata, not `value` — USDC uses 6 decimals (general knowledge, not stated in fetched Privy docs).
- **Policies default-deny**: a wallet whose policy lacks a rule for the requested RPC method denies it; attach policy at creation via `policy_ids`.
- `privy-request-expiry` is Unix **milliseconds** (example in docs: `1773679531000`); replay protection — skew between agent host clock and Privy will fail requests.
- Authorization private keys must be base64 PKCS8 **without PEM headers**; sign functions must produce ECDSA P-256 base64 signatures.
- `@privy-io/node` requires Node.js 20+ (per SDK README; Bun, Deno, Cloudflare Workers, Vercel Edge also supported); browser runtimes throw. CLI sessions: recipe page says up to 30 days, skill.md says auto-refresh until refresh-token revocation; Linux CLI needs `libsecret-tools` or falls back to `~/.privy/session.json`.
- `createX402Client` is `@experimental` — pin `@privy-io/node@0.21.0` for the hackathon and retest on upgrade.
- Rate limits: NOT FOUND IN DOCS — verify before use.

## Minimal Working Example

```ts
// npm install @privy-io/node    (Node 20+; verified @privy-io/node@0.21.0)
// env: PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_AUTHORIZATION_KEY (base64 PKCS8 P-256, no PEM headers)
import {APIError, PrivyAPIError, PrivyClient} from '@privy-io/node';

const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
});

async function main() {
  try {
    // 1. Create the ActFlow agent's wallet (attach a default-deny policy via policy_ids)
    const wallet = await privy.wallets().create({chain_type: 'ethereum'});
    console.log('agent wallet', wallet.id, wallet.address);

    // 2. Send an EVM transaction (Sepolia; CAIP-2 + chain_id must agree)
    const tx = await privy.wallets().ethereum().sendTransaction(wallet.id, {
      caip2: 'eip155:11155111',
      params: {
        transaction: {
          to: '0x0000000000000000000000000000000000000000', // task payee — replace
          value: '0x1',          // wei, hex string
          chain_id: 11_155_111,
        },
      },
      authorization_context: {
        authorization_private_keys: [process.env.PRIVY_AUTHORIZATION_KEY!],
      },
    });
    console.log('tx hash', tx.hash);
  } catch (error) {
    if (error instanceof APIError) console.error(error.status, error.name);
    else if (error instanceof PrivyAPIError) console.error(error.message);
    else throw error;
  }
}
main();
```

For ActFlow's x402 hire-and-pay flow, wrap task calls (experimental API, signature verbatim from SDK):

```ts
// npm install @x402/fetch   (optional peerDependency of @privy-io/node — NOT installed automatically)
import {createX402Client} from '@privy-io/node/x402';
import {wrapFetchWithPayment} from '@x402/fetch';
const x402client = createX402Client(privy, {walletId: wallet.id, address: wallet.address});
const fetchWithPayment = wrapFetchWithPayment(fetch, x402client);
const res = await fetchWithPayment('https://api.example.com/premium'); // 402s auto-paid in USDC
```

## Sources

- https://docs.privy.io/recipes/agent-integrations/agent-cli — fetched 2026-06-12
- https://agents.privy.io — fetched 2026-06-12 (sandbox app shell; wallets at `/`, agents at `/manage`)
- https://agents.privy.io/skill.md — fetched 2026-06-12 (canonical CLI invocation)
- https://docs.privy.io/llms.txt — fetched 2026-06-12 (doc URL index)
- https://docs.privy.io/basics/nodeJS/quickstart — fetched 2026-06-12
- https://docs.privy.io/wallets/wallets/create/create-a-wallet — fetched 2026-06-12
- https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction — fetched 2026-06-12
- https://docs.privy.io/controls/authorization-keys/owners/overview — fetched 2026-06-12 (concept only; no key-gen details on page)
- https://docs.privy.io/controls/policies/overview — fetched 2026-06-12
- https://docs.privy.io/recipes/agent-integrations/agentic-wallets — fetched 2026-06-12
- https://docs.privy.io/api-reference/authorization-signatures — fetched 2026-06-12
- npm registry + local type-definition inspection of @privy-io/node@0.21.0 and @privy-io/agent-wallet-cli@0.3.1 READMEs — fetched 2026-06-12
