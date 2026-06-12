---
name: world-id
description: World ID proof-of-human verification (IDKit widget + server-side cloud proof verification, nullifier dedup, simulator testing) for gating ActFlow free trials to unique humans. Use when adding "verify with World ID", sybil-resistant one-per-human flows, or backend proof verification.
---

# World ID — Proof of Human for ActFlow Free Trials

ActFlow use case: gate ONE free agent trial per unique human. Frontend opens the IDKit
widget; user proves humanness in World App; backend verifies the ZK proof via the cloud
verify endpoint (HARD REQUIREMENT: verify server-side, never trust the client); the
returned nullifier is stored to dedup trials per human.

IMPORTANT version context (as of 2026-06): World ID 4.0 is current. IDKit must be `^4.x`
(v2/v3 packages are deprecated). Legacy v3 proofs still work during migration Phase 2
(2026-06-01 to 2027-03-31) via `allow_legacy_proofs`; World App stops generating v3 proofs
2027-04-01. The v2 verify endpoint remains documented with NO stated shutdown date.
(https://docs.world.org/world-id/4-0-migration.md)

## Setup & Auth

```bash
pnpm add @worldcoin/idkit        # React widget (^4.x only)
npm i @worldcoin/idkit-core      # vanilla JS core (@worldcoin/idkit-standalone is DISCONTINUED)
```

Developer Portal: https://developer.world.org — create team, then app, then an action.
- API keys: Portal > team > API keys. Prefixed `api_`, shown ONCE, grant full team access — server-only secret.
- Signing key (for RP signatures, World ID 4.0): returned ONE TIME — "not recoverable from the portal". Loss requires rotation (`rotate_world_id_signing_key`).
- Optional MCP for portal automation (tools incl. `create_app`, `configure_world_id`, `create_world_id_action`, `get_world_id_registration_status`, `get_world_id_signing_key`, `rotate_world_id_signing_key`):
  `claude mcp add --transport http --scope project --header "Authorization: Bearer api_YOUR_TOKEN" world-developer-portal https://developer.world.org/api/mcp`
- Action config: set max verifications per human in the Portal. `max_verifications` is the
  per-action cap per user; `0` = unlimited (UNVERIFIED — not in fetched docs; confirm in Portal). For ActFlow free trials set it to 1 — the verify
  API then rejects repeats with `exceeded_max_verifications` / `already_verified`.

Suggested env vars (ActFlow convention, not from docs):

```bash
NEXT_PUBLIC_WLD_APP_ID=app_xxxxx        # public, used by widget
WLD_ACTION=agent-free-trial             # action id created in Portal
WLD_API_KEY=api_xxxxx                   # server-only (Portal API)
WLD_SIGNING_KEY=...                     # server-only (4.0 RP signatures)
```

## Core API

### Cloud verify — legacy v2 endpoint (still live in Phase 2; simplest for hackathon)

```
POST https://developer.world.org/api/v2/verify/{app_id}        (primary host)
POST https://developer.worldcoin.org/api/v2/verify/{app_id}    (legacy host)
POST https://staging-developer.worldcoin.org/api/v2/verify/{app_id}  (staging)
```
Source: https://docs.world.org/api-reference/developer-portal/verify-legacy.md

Request body (JSON):
- `nullifier_hash` (string, required) — "The unique user identifier (called the nullifier hash in the ZKP)"
- `proof` (string, required) — "The zero-knowledge proof, as provided by IDKit"
- `merkle_root` (string, required) — "hash of the Merkle root that proves membership to the set of credentials"
- `verification_level` (string, required) — "The verification level, as provided by IDKit". `orb` appears in docs (v4 identifier example); `device` is the historical second value (UNVERIFIED in current docs — confirm in Portal)
- `action` (string, required) — "Same action identifier as passed to IDKit"
- `signal_hash` (string, optional) — "The hash of the signal that was used to generate the proof"
- `max_age` (integer, optional) — accepted root age in seconds, range 3600–604800, default 7200

200 response: `{ "success": true, "action": "...", "nullifier_hash": "0x...", "created_at": "..." }`
400 error codes: `invalid_proof`, `invalid_merkle_root` (user appears unverified),
`root_too_old`, `invalid_credential_type`, `exceeded_max_verifications`, `already_verified`.

### Cloud verify — current v4 endpoint

```
POST https://developer.world.org/api/v4/verify/{rp_id}
```
Source: https://docs.world.org/api-reference/developer-portal/verify.md

Accepts three `oneOf` body shapes — "Forward the IDKit result payload as-is. No field
remapping is required." (quote from https://docs.world.org/world-id/idkit/integrate):
1. Legacy v3 proofs: `protocol_version: "3.0"`, `nonce`, `action`, `environment` ("production"|"staging"),
   `responses[]` of `{ identifier, merkle_root, nullifier, proof, signal_hash, max_age }` (identifier e.g. `"orb"`)
2. Uniqueness v4: `protocol_version: "4.0"`, `nonce`, `action`, `responses[]` of
   `{ identifier, issuer_schema_id, nullifier, expires_at_min, proof: [5 strings], signal_hash }`
3. Session v4: `protocol_version: "4.0"`, `nonce`, `session_id`, `responses[]` with `session_nullifier: [nullifier, action]`

200: `{ success: true, action?, nullifier?, created_at?, environment?, session_id?, message?, results: [{ identifier?, success?, nullifier?, code?, detail? }] }`
Errors: `app_not_migrated`, `all_verifications_failed`, `verification_error`.

### IDKit React widget (`@worldcoin/idkit` ^4.x)

Source: https://docs.world.org/world-id/idkit/react.md
Exports: `IDKitRequestWidget`, `IDKitInviteCodeRequestWidget`, hooks `useIDKitRequest`, `useIDKitInviteCodeRequest`.

`IDKitRequestWidget` props: `open` (bool, req), `onOpenChange` (fn, req), `app_id` ("app_xxxxx", req),
`action` (string, req), `rp_context` (req — `{ rp_id, nonce, created_at, expires_at, signature }`,
generated SERVER-SIDE — docs show `import { signRequest } from "@worldcoin/idkit/signing"`; full
algorithm at https://docs.world.org/world-id/idkit/signatures — not fetched, read before implementing),
`preset` (req — e.g. `orbLegacy({ signal: "..." })` = proof of human; also `selfieCheckLegacy({ signal })`;
`secureDocumentLegacy` is UNVERIFIED — not in fetched react docs, verify before use),
`allow_legacy_proofs` (bool; req/opt status not stated — examples pass it explicitly),
`environment` ("production", or "staging" for simulator testing), `handleVerify` (async fn, opt —
do backend verification here; throwing blocks success), `onSuccess` (fn, req), `onError` (fn, opt),
`language` (opt: "en"|"es"|"th"), `autoClose` (opt, default true).

Note: the pre-4.0 `IDKitWidget` (props `app_id`, `action`, `signal`, `verification_level`
orb/device, `handleVerify`, `onSuccess`) is the API most tutorials show — it is NOT in the
current docs; use `IDKitRequestWidget`. The `signal` concept survives via `preset` (e.g.
`orbLegacy({ signal })`): "data attached to the proof that cannot be tampered with".

### Nullifier semantics (the dedup key)

"A unique identifier for a combination of a user, `app_id`, and `action`" — same human +
same action always yields the same nullifier, but nullifiers are unlinkable across apps.
Store it with a `UNIQUE (action, nullifier)` constraint (`NUMERIC(78, 0)` in Postgres) and
reject inserts that conflict = one free trial per human. The nullifier is also anti-replay:
without storing it, a user can submit the same proof twice.
(Sources: https://docs.world.org/world-id/concepts.md, https://docs.world.org/world-id/SKILL.md)
4.0 nuance: uniqueness-proof nullifiers dedup as above. Session proofs return
`session_nullifier: [nullifier, action]` plus a top-level `session_id`; the claim that session
nullifiers are one-time-use with `session_id` as the stable cross-request link is
UNVERIFIED — not confirmed in fetched docs, verify before relying on it.

## Addresses & Chain Config

ActFlow uses CLOUD verification — no contracts, chain IDs, or gas needed. Verbatim values from fetched sources:

- Verify API primary host: `https://developer.world.org` — https://docs.world.org/api-reference/developer-portal/verify.md
- Verify API legacy host: `https://developer.worldcoin.org` — https://docs.world.org/api-reference/developer-portal/verify-legacy.md
- Verify API staging host: `https://staging-developer.worldcoin.org` — https://docs.world.org/api-reference/developer-portal/verify-legacy.md
- Developer Portal: `https://developer.world.org` — https://docs.world.org/model-context-protocol/developer-portal.md
- Simulator: `https://simulator.worldcoin.org` — https://docs.world.org/world-id/idkit/integrate
- Default v3 `signal_hash` (empty signal): `0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4`; v4 default: `0x0` — https://docs.world.org/api-reference/developer-portal/verify.md
- On-chain WorldIDRouter contract addresses: NOT FOUND IN DOCS — verify before use (see https://docs.world.org/world-id/idkit/onchain-verification.md, not fetched)

## Gotchas

- **Backend-only verification.** Never trust `onSuccess` alone — verify inside `handleVerify`
  on your server. Forward the proof JSON byte-for-byte; any mutation/remapping breaks
  verification (v2 `invalid_proof` / v4 `verification_error` — docs: "DO NOT mutate,
  re-encode, or trim the proof JSON before forwarding").
- **Version trap:** install `@worldcoin/idkit@^4.x`. v2/v3 imports break; the rp context type
  export is `RpContext` (no `I` prefix — docs show `import { ... type RpContext } from "@worldcoin/idkit"`).
- **Environment must match end-to-end:** staging action + simulator, production action + real
  World App. Per docs: "A staging action with the production World App will silently produce
  zero proofs and look like a frontend bug."
- **Simulator** (https://simulator.worldcoin.org): test without a real human — create the
  action with `environment: "staging"`, open the widget's QR/connector URI in the simulator,
  it generates valid staging proofs. Staging proofs NEVER verify against a production action.
- **One free trial per human:** set max verifications = 1 on the action in the Portal
  (`max_verifications`; 0 = unlimited — UNVERIFIED, see Setup). Handle `exceeded_max_verifications` and
  `already_verified` as "trial already used" — show the paid x402/USDC flow instead.
- **Proofs expire:** `max_age` 3600–604800s (default 7200) on v2/v3; `root_too_old` means the
  user must generate a fresh proof. Don't queue proofs for later verification.
- **Secrets shown once:** Portal API key (`api_` prefix) and the app signing key are displayed
  one time only. Persist to server-only storage immediately.
- **On-chain registration lag:** new apps may not be registered immediately; poll the
  `get_world_id_registration_status` MCP tool until registered (exact response field
  names/values, e.g. `production_status`/`staging_status`/`registered`, are UNVERIFIED —
  not in fetched docs; check the tool's actual output).
- **Signal binding:** pass the user's Privy wallet address as the `signal` so the proof can't
  be replayed for a different wallet claiming the trial.

## Minimal Working Example

Next.js route handler — server-side verification + one-trial-per-human dedup (v2 legacy
endpoint — no documented shutdown date, but World App stops generating the v3 proofs it
consumes 2027-04-01; field names verbatim from verify-legacy docs):

```ts
// app/api/free-trial/route.ts
import { NextResponse } from "next/server";

const APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID!; // app_xxxxx
const ACTION = process.env.WLD_ACTION!;             // "agent-free-trial"

type IDKitProof = {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string; // "orb"
  signal_hash?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as IDKitProof;

  const res = await fetch(`https://developer.world.org/api/v2/verify/${APP_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nullifier_hash: body.nullifier_hash,
      proof: body.proof,
      merkle_root: body.merkle_root,
      verification_level: body.verification_level,
      action: ACTION,                  // same action id as passed to IDKit
      signal_hash: body.signal_hash,   // optional; binds proof to Privy wallet
    }),
  });
  const verdict = await res.json();

  if (!res.ok || !verdict.success) {
    if (verdict.code === "exceeded_max_verifications" || verdict.code === "already_verified") {
      return NextResponse.json({ error: "free_trial_used" }, { status: 403 });
    }
    return NextResponse.json({ error: verdict.code ?? "invalid_proof" }, { status: 400 });
  }

  // Dedup: UNIQUE (action, nullifier) NUMERIC(78,0) — insert-or-reject one trial per human
  // await db.insert(trials).values({ action: ACTION, nullifier: verdict.nullifier_hash });
  return NextResponse.json({ ok: true, nullifier: verdict.nullifier_hash });
}
```

Client side: `IDKitRequestWidget` (props above) with `preset={orbLegacy({ signal: privyAddress })}`,
`allow_legacy_proofs={true}`, and `handleVerify` POSTing the result to `/api/free-trial`.
`rp_context` must come from your backend (signatures doc — read it first; not fetched here).

## Sources

- https://docs.world.org/world-id/overview — fetched 2026-06-12
- https://docs.world.org/llms.txt — fetched 2026-06-12
- https://docs.world.org/world-id/idkit/integrate — fetched 2026-06-12
- https://docs.world.org/world-id/concepts.md — fetched 2026-06-12
- https://docs.world.org/api-reference/developer-portal/verify-legacy.md — fetched 2026-06-12 (v2 endpoint, body fields, error codes)
- https://docs.world.org/api-reference/developer-portal/verify.md — fetched 2026-06-12 (v4 endpoint, oneOf bodies)
- https://docs.world.org/world-id/idkit/react.md — fetched 2026-06-12 (IDKitRequestWidget props; only `orbLegacy` and `selfieCheckLegacy` presets shown)
- https://docs.world.org/world-id/4-0-migration.md — fetched 2026-06-12 (phases, allow_legacy_proofs)
- https://docs.world.org/model-context-protocol/developer-portal.md — fetched 2026-06-12 (portal, API keys, MCP)
- https://docs.world.org/world-id/SKILL.md — fetched 2026-06-12 (redirect from https://world.id/SKILL.md; pitfalls, nullifier storage)
- max_verifications "0 = unlimited" semantics: docs.world.org Developer Portal API reference via WebSearch (page not directly fetchable) — treat as soft-verified
