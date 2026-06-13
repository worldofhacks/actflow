# SALVAGE — actflow-frontend ("agent-ads", private repo, last commit 2025-06-06)

## Stack
Next.js 15.1.4 (App Router, server actions) · React 19 · TypeScript · Tailwind 3.4 + shadcn/ui
(Radix, `components.json`) + tailwindcss-animate/-motion · next-auth v4 (Google, Twitter,
credentials, wallet) · RainbowKit 2 + wagmi 2 + viem 2 · TanStack Query 5 · Zustand 5 ·
Formik+zod and react-hook-form (both) · framer-motion · recharts. ~23.7k LOC, 69 MB `public/`.

## What works
- **Design system**: `components/ui/` (~40 shadcn components incl. data-table, skeleton-loaders),
  `tailwind.config.ts` (`act`/`act-2` palettes — turquoise `#89f9e8`, gold `#facb7b`, purple
  `#d77fec`, base-dark `#0e0c15`), `app/globals.css` (677 lines: HSL vars, heading/body classes),
  `lib/config/fonts.ts` (Sora + 5 Google fonts + 2 local fonts in `public/fonts/`).
- **Landing page**: `app/(landing)/` — purely presentational hero/features/FAQ sections + assets.
- **Agent directory**: `discover/` (search + filter UI → `POST /agents/search`), `components/agent/agent-card.tsx`.
- **Agent profile + hire**: `agent/[id]/` (profile/skills/performance/tasks sections), `agent/[id]/hire/`, `agent/add/`.
- **Task lifecycle views**: `tasks/` (list, new, `[id]`, `[id]/submit`) and `board/` with per-role
  (buyer/seller/validator) components; role switching via cookie (`actions/role.ts`).
- **API client layer**: `lib/service/*` server actions over a `fetchWithAuth` wrapper
  (`lib/service/index.ts`) injecting the next-auth session bearer token. ~60 endpoints; all but
  five (below) match live controllers in `actflow-backend` (agents, tasks, auth, users, wallet,
  dashboard, notifications, validators, invitation-codes, static, transactions, tickets, twitter).

## Dead or coupled to dead infra
- **Dead endpoint calls** (exported but unused — backend has no matching route):
  `GET /agents/recommended`, `GET /agents/top-performers`, `POST /tasks/complete-task`,
  `POST /tasks/:id/refresh-ipfs`; `GET /agents/metadata/:id` is path-swapped vs backend `/agents/:id/metadata`.
- **Phyllo** (3rd-party social-data SDK, product discontinued): `types/user/phyllo.ts`, phyllo
  calls in `authService`/`userService`, register-with-phyllo flow.
- **Twitter proxy**: `NEXT_PUBLIC_TWITTER_API_URL` external service + Twitter OAuth token exchange.
- **Wallet auth**: "wallet login" posts the bare address (no signed message / SIWE) — must be
  rebuilt on signature-based auth; registration also sends `roles` from the client.
- **Custodial wallet pages**: `wallet/` (generate / depositWIP / max-allowance) targets the old
  backend's custodial Story-token wallets — superseded by the new payment stack.
- **Chat**: `chat/page.tsx` renders hardcoded conversations; only real call is `POST /native-agent/:id/message` (Eliza runtime, replaced by Mastra).
- **Gating**: invite-code + generated-wallet gate in `(password-protected)/layout.tsx`, `referral/` growth loop.
- (Contracts context, where relevant: config rebuilt from scratch; source git history not imported.)

## Verdicts
| Module | Verdict | Reason |
|---|---|---|
| `components/ui/`, `tailwind.config.ts`, `globals.css`, fonts | PORT | Self-contained design system; visual identity lives here |
| `app/(landing)/` + needed `public/` assets | PORT | Presentational, no API coupling |
| `discover/` + `components/agent/` | PORT | Works against `/agents/search`; swap service layer only |
| `agent/[id]/`, `agent/[id]/hire`, `agent/add` | PORT | Solid views; re-point data fetching |
| `tasks/`, `board/`, `components/task/` | PORT | Endpoint-complete vs backend; adapt to new task semantics |
| `lib/service/*` + types | PORT | Keep pattern/types; delete 5 dead endpoints + phyllo fns |
| `dashboard/`, `notifications/`, stores | REWRITE | UI reusable but data shapes tied to old backend DTOs |
| `auth.config.ts`, sign-up/verify flows, middleware | REWRITE | next-auth v4 + addr-only wallet login + Phyllo/Twitter-proxy coupling |
| `wallet/` pages | REWRITE | Custodial WIP-token flow; rebuild on new payment stack |
| `chat/` | REWRITE | Mock UI; rebuild on Mastra streaming chat |
| Phyllo (types/services), `NEXT_PUBLIC_TWITTER_API_URL` calls | DROP | Vendor dead |
| Invite-code gate, `referral/`, `weekly-summary.sh`, dead agent/task endpoints | DROP | Pre-launch growth gating, not needed |
