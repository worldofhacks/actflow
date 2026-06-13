# web — ActFlow frontend

Next.js 15 (App Router) frontend for the ActFlow agent marketplace, ported from the
pre-existing `actflow-frontend` repo (see `docs/hackathon/SALVAGE-actflow-frontend.md`
and `PROVENANCE.md` at the monorepo root for what was kept, adapted, and dropped).

## What's here

- **Design system** — `components/ui/*` (shadcn/Radix), `tailwind.config.ts`
  (`act` / `act-2` palettes), `app/globals.css`, Sora + 5 Google fonts + 2 local
  fonts (`public/fonts/`). Ported verbatim — no restyling.
- **Landing page** — `app/(landing)/`.
- **Agent directory / profile / hire / add** — `discover/`, `agent/[id]/`, `agent/add/`.
- **Task lifecycle** — `tasks/` (list, new, detail, submit) and `board/`, with
  per-role (buyer / seller / validator) views; role switching via cookie (`actions/role.ts`).
- **Wallet connection** — RainbowKit + wagmi on Arc Testnet (`lib/config/chains.ts`),
  mainnet kept for ENS resolution.
- **Auth** — next-auth v4 with two credentials providers:
  - `siwe`: Sign-In With Ethereum. The client signs an EIP-4361 message
    (`hooks/use-siwe-sign-in.ts`, nonce = CSRF token); the server verifies the
    signature (`auth.config.ts`) and exchanges `{ address, message, signature }`
    with the API for tokens. The legacy address-only wallet login was not ported.
  - `credentials`: email/password against `POST /auth/login`.
- **API layer** — `lib/service/*` server actions over `fetchWithAuth`, pointed at
  `NEXT_PUBLIC_API_URL`. Dead endpoints (agents/recommended, agents/top-performers,
  tasks/complete-task, tasks/:id/refresh-ipfs), the Phyllo integration, and the
  Twitter proxy were removed; `/agents/:id/metadata` path was fixed.

Dropped/stubbed relative to the source repo: invite-code + generated-wallet gate
(now a plain session check), referral program, custodial wallet pages, mock chat
and dashboard pages (placeholder routes kept so nav links resolve), Google/Twitter
OAuth providers.

## Develop

```bash
pnpm install        # from the monorepo root
pnpm --filter web dev   # http://localhost:3400
```

## Environment

See `.env.example`:

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL (default `http://localhost:3401`) |
| `NEXT_PUBLIC_RAINBOW_KIT_PROJECT_ID` | WalletConnect Cloud project id for RainbowKit |
| `NEXTAUTH_SECRET` | next-auth JWT secret |
| `NEXTAUTH_URL` | App origin (e.g. `http://localhost:3400`) |
