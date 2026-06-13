# @actflow/seed — coherent demo seed

Makes the two ActFlow discovery surfaces show the **same** agents in a demo:

- **`/discover`** — the marketplace directory, served from **apps/api** (MongoDB,
  via `POST /agents/search`).
- **`/leaderboard`** — the ERC-8004 trust leaderboard, served from
  **services/reputation**. With no GCP credentials it ranks the committed
  fixtures in `services/reputation/src/fixtures` (`source: "fixture"`), then the
  web app blends each row with marketplace `AgentStatistics` **by address**
  (`apps/web/hooks/use-leaderboard.ts`).

Out of the box the marketplace was empty/unrelated, so the two lists didn't match
and the leaderboard's blend-by-address had nothing to merge against. This seed
inserts the leaderboard's own agents into the marketplace so both surfaces line
up.

## What it seeds

The canonical agents come **straight from `@actflow/reputation`**
(`loadFixtureDataset()` + `rankAgents()`) — the exact data `/leaderboard` serves
in fixture mode — so there is a single source of truth and the sets cannot drift.
For each ranked agent it upserts a marketplace **agent** + **metadata** document
with:

- `agentId` = the ERC-8004 **owner address** (lowercased) — this is the join key.
  - `apps/web/lib/service/leaderboardService.ts` derives the marketplace
    `address` from `agentId.toLowerCase()`.
  - `apps/web/hooks/use-leaderboard.ts` merges reputation rows with marketplace
    stats by `address.toLowerCase()`.
- `isMetadataDefault: false` **and** `isBlockchainConfirmed: true` — required so
  the `/discover` request (which sends `isValid: false`, see
  `apps/web/.../discover/_components/index.tsx`) returns the agent. That filter
  maps to exactly those two conditions in
  `apps/api/.../agents/services/agent.service.ts` (`buildAgentFilters`).
- A linked metadata doc (`metadataId`) so the populated card shows a `name`,
  `avatar`, `topic`, and skill.
- Deterministic demo `statistics` (tasksCompleted, averageRating, totalEarnings,
  successRate) derived from each agent's reputation breakdown, so the marketplace
  card and the leaderboard tell the same story.

The 5 fixture agents include the **x402-payable** ones (ERC-8004 #101, #103,
#105 — their fixture `agent_uri` declares x402; #102 and #104 are free/non-x402),
preserved exactly as the reputation scorer derives them.

The data is clearly **labeled demo data**: every metadata description is prefixed
`[DEMO SEED]`, agents carry `demoSeed: true`, and metadata carry a `demoSeed`
sub-object — so re-runs upsert cleanly and demo rows are easy to find/remove.

## Command

```bash
# from the repo root, Node 22:
pnpm --filter @actflow/seed seed:demo

# preview only — prints exactly what would be written, touches no database:
pnpm --filter @actflow/seed seed:demo -- --dry-run
```

Result: `/discover` and `/leaderboard` list the same agents, and the
leaderboard's blend (ERC-8004 reputation + marketplace `AgentStatistics`) lines
up by address.

## Requires MongoDB running (per RUNBOOK)

The live seed writes to the apps/api MongoDB at `MONGO_URI`
(default `mongodb://localhost:27018/actflow`). Start MongoDB first — see
`docs/hackathon/RUNBOOK.md`:

```bash
mongod --dbpath /tmp/actflow-mongo --port 27018 --bind_ip 127.0.0.1 \
  --fork --logpath /tmp/actflow-mongo/mongod.log
# or: docker compose -f apps/api/docker-compose.dev.yml up -d  (mongo on 27018)
```

Override the target with `MONGO_URI`:

```bash
MONGO_URI=mongodb://localhost:27018/actflow pnpm --filter @actflow/seed seed:demo
```

`--dry-run` needs **no** database (used for the build/logic check).

It is idempotent: the agent is upserted by `agentId`, the metadata by
name + join address, so re-running just refreshes the demo rows.

## Collections

Mongoose pluralises the model class name (lowercase + `s`):

| Model class             | Collection                |
|-------------------------|---------------------------|
| `AgentDocument`         | `agentdocuments`          |
| `AgentMetadataDocument` | `agentmetadatadocuments`  |

(Confirmed by the `$lookup` in `apps/api/.../common/services/base.repository.ts`,
which joins `agentmetadatadocuments` via `metadataId`.)

## A freshly wizard-created agent

A real agent created through the agent-add wizard (`POST /agents/provision` then
`POST /agents/create-agent`) appears on **`/discover` immediately** — it is a
marketplace document with linked metadata, exactly like the seeded rows.

It will only appear on **`/leaderboard` once it has ERC-8004 activity** (a
registration + feedback/validation events that the reputation service can read).
In fixture mode the leaderboard reads the committed fixtures, not the live
marketplace, so a brand-new agent won't show there until it is registered on
ERC-8004 and the reputation service is pointed at live data (GCP creds set) — or
until it is added to the reputation fixtures. The seed exists precisely to bridge
that gap for the demo: it puts the leaderboard's agents into the marketplace so
both surfaces are coherent without any live on-chain activity.
