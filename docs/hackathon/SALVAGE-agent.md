# SALVAGE — `agent` (old Eliza-based runtime)

Source: `ACT-LABS-IO/agent` (private), audited at `0ba32c7`. Eliza runtime is being killed; this doc lists what to mine for the Mastra rebuild. **No file from this repo is imported wholesale** — character JSONs carry a `settings.secrets` block and the repo root carries operational files; every salvaged file is hand-reviewed and secrets-stripped before landing.

## Stack

ElizaOS monorepo fork (pnpm + lerna/turbo, TypeScript, Node 23): stock Eliza `core`/clients/adapters plus custom packages under `packages/` — `marketplace-plugin` (on-chain task loop), `act-api`, `act-blog`, `act-image-generation`, `act-video-generation`, `act-socials`, `act-validator`, `act-native-agent`, `act-contract` (dist-only ABI/types), and Figment-era trading packages (`plugin-figment`, `plugin-figment-strategy`, `figment-api`, `plugin-orderly`). Chain writes via ethers v6; per-agent state in Eliza's sqlite adapter; deployed via PM2.

## What works (mine these)

- **Marketplace task loop** (`packages/marketplace-plugin/src`): poll blocks → decode `AssignTask*` events → fetch task prompt from backend API → dispatch to topic handler → queue result → `submitTask(taskId, result)` on-chain, with retry, submission and heartbeat background jobs. The topic taxonomy and topic→action map live in `src/types/ITopicHandler.ts` (`x:*`, `img:*`, `video:video`, `blog:*`). This is the core ActFlow agent behavior — the *design* transfers cleanly to Mastra workflows even though the code is Eliza-coupled.
- **Generation skills**: image (gpt-image-1 / DALL-E / Ideogram / mixed — `act-image-generation/src/imageHelpers.ts`), video (vyro.ai text-to-video — `act-video-generation/src/generateVideo.ts`), blog pipeline (DataForSEO news search + content parsing → LLM article synthesis → cover images → publish — `act-blog/src/blogHelpers.ts`). Thin Eliza wrappers; bodies are portable fetch + prompt code.
- **Prompt templates**: character system prompts for the marketplace personas (`characters/actle.img.prod.json`, `video.prod.json`, `blog.blog.json`, `news.blog.json`, `tasky.character.json`, Borat persona in `actle.img.local.json`) and inline prompts in `act-blog/src/blogHelpers.ts`, `act-socials/src/x.ts`, `act-socials/src/helpers/generateThread.ts`.
- **Validator agent** (`packages/act-validator/src`): stake-check + validation-check jobs calling the marketplace contract — small, clear reference for the validator role.
- **Event/ABI reference**: `act-contract/dist/types/EVENT_SIGNATURES.*` and `market.types` enumerate every marketplace event + `TaskState`. Cross-check only — the monorepo's contracts package is authoritative (config rebuilt from scratch; source git history not imported).

## Dead or coupled to dead infra

- All stock ElizaOS packages (`core`, `cli`, `client-*`, `adapter-*`, `plugin-bootstrap/tee/twitter/evm`, `client/` UI) — upstream code, dies with Eliza.
- Figment trading stack (`plugin-figment`, `plugin-figment-strategy`, `figment-api`, `plugin-orderly`, root `prompt-*.md` / `figment-strategy-*.md` files, `docs-figment/`) — other project; the Figment repo is mined separately.
- Trading/Figment characters: `bakica.figment.json`, `borcez.sol.json`, `devnet_5c6ce1eb.character.json`, `figment-strategy*.character.json`, `generated-trader.json`; plus `bitcinonews.blog.json` (Bitcino-branded blog agent, third-party endpoints).
- `act-socials/src/x.ts` posting path — cookie-based Twitter scraping client; fragile, replace with official API. Prompts inside are still worth mining.
- `agent-manager/` — PM2 export/import/migration scripts for Eliza agent processes.
- `marketplace-plugin` storage layer — raw sqlite via Eliza `databaseAdapter`; redo persistence natively in the new stack.

## Verdicts

| Module | Verdict | Reason |
|---|---|---|
| `characters/` ActFlow set (actle, video, blog/news, tasky, Borat) | PORT | Personas + task-shaped system prompts map 1:1 to Mastra agents; strip `settings.secrets` |
| `characters/` Figment/trader/Bitcino set | DROP | Other-project leftovers (trading bots, Bitcino blog) |
| `packages/marketplace-plugin` | REWRITE | Task-lifecycle design + jobs are the product; code welded to Eliza Service/runtime/sqlite |
| `packages/act-image-generation` | PORT | Provider-agnostic image helpers, lift into Mastra tools |
| `packages/act-video-generation` | PORT | Self-contained vyro.ai client |
| `packages/act-blog` | PORT | News→blog pipeline + prompts; swap Bitcino publish endpoints |
| `packages/act-socials` | REWRITE | Mine tweet/thread prompts; posting transport is dead cookie auth |
| `packages/act-validator` | REWRITE | Right behavior, small; redo against new contracts + stack |
| `packages/act-api` | REWRITE | Trivial JWT client; re-implement against new backend |
| `packages/act-contract` | DROP | dist-only ABI snapshot; regenerate from monorepo contracts (config rebuilt from scratch; source git history not imported) |
| `packages/act-native-agent` | DROP | Agent/task search provider superseded by backend/frontend |
| Figment packages (`plugin-figment*`, `figment-api`, `plugin-orderly`) | DROP | Other project; mined via the Figment repo instead |
| Stock Eliza packages + `client/` + `agent-manager/` | DROP | Upstream runtime and its ops tooling die with Eliza |
