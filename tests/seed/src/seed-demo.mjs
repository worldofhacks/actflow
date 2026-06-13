#!/usr/bin/env node
/**
 * ActFlow coherent demo seed — `pnpm --filter @actflow/seed seed:demo`.
 *
 * THE PROBLEM IT FIXES
 * --------------------
 * In a demo the two discovery surfaces showed DIFFERENT agents, which looks
 * broken:
 *   - /discover     reads the apps/api MongoDB marketplace (POST /agents/search).
 *   - /leaderboard  reads services/reputation, which (without GCP creds) ranks
 *                   the committed ERC-8004 fixtures in services/reputation/src/fixtures.
 * The marketplace was empty / unrelated, so nothing lined up — and the
 * leaderboard's "blend by address" (ERC-8004 reputation + marketplace
 * AgentStatistics) had nothing to merge against.
 *
 * WHAT THIS DOES
 * --------------
 * Inserts the SAME agents that the reputation leaderboard already ranks into the
 * marketplace, keyed by the ERC-8004 owner address. The canonical agents come
 * straight from @actflow/reputation's loadFixtureDataset() + rankAgents() — i.e.
 * the EXACT data the leaderboard fixture mode serves — so there is one source of
 * truth and the sets cannot drift.
 *
 * After seeding:
 *   - /discover lists these agents (marketplace docs satisfy the discover filter).
 *   - /leaderboard lists the same agents (unchanged — fixture-backed).
 *   - The leaderboard's merge-by-address finds a marketplace row for every
 *     reputation row, because each marketplace agent's `agentId` IS the
 *     reputation `owner_address` (lowercased). The blend lines up.
 *
 * HOW THE JOIN WORKS (traceable to the repo)
 *   - apps/web/hooks/use-leaderboard.ts merges reputation rows with marketplace
 *     stats by `address.toLowerCase()`.
 *   - apps/web/lib/service/leaderboardService.ts derives that marketplace
 *     `address` from each agent's `agentId` (lowercased).
 *   - apps/api AgentService.searchAgents: a discover request sends
 *     `isValid:false` (apps/web .../discover/_components/index.tsx), which makes
 *     buildAgentFilters require `isMetadataDefault:false` AND
 *     `isBlockchainConfirmed:true`, then populates metadata from the
 *     `agentmetadatadocuments` collection via `metadataId`.
 *   So we set agentId = owner_address (lc), isMetadataDefault=false,
 *   isBlockchainConfirmed=true, and link a metadata doc by metadataId.
 *
 * SAFETY / HONESTY
 *   - Idempotent: upsert by agentId (re-running just refreshes the demo rows).
 *   - Clearly LABELED demo data: metadata.description is prefixed "[DEMO SEED]"
 *     and isPlatformManaged=true. These are NOT real on-chain marketplace agents.
 *   - The marketplace statistics are derived deterministically from the same
 *     reputation fixture (feedback count, average rating, recency) so the two
 *     surfaces tell a consistent story — but they are demo numbers, not live.
 *   - --dry-run prints exactly what WOULD be written and touches no database
 *     (so this file can be parse/logic-checked with no Mongo).
 *
 * USAGE
 *   pnpm --filter @actflow/seed seed:demo            # write to MONGO_URI
 *   pnpm --filter @actflow/seed seed:demo -- --dry-run   # print only, no DB
 *   MONGO_URI=mongodb://localhost:27018/actflow pnpm --filter @actflow/seed seed:demo
 */

import { loadFixtureDataset, rankAgents } from '@actflow/reputation';

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------
const DRY_RUN =
  process.argv.includes('--dry-run') || process.env.SEED_DRY_RUN === '1';

// Same default the apps/api .env.example uses for the local docker mongo.
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27018/actflow';

// Collection names: Mongoose pluralises the model class name (lowercase + "s").
// AgentDocument          -> "agentdocuments"
// AgentMetadataDocument  -> "agentmetadatadocuments"
// (Confirmed by apps/api base.repository.ts $lookup `model.toLowerCase()+'s'`.)
const AGENTS_COLLECTION = 'agentdocuments';
const METADATA_COLLECTION = 'agentmetadatadocuments';

// Pin "now" so the derived demo stats are deterministic across runs. Matches the
// nowMs used by the leaderboard fixture step in tests/e2e/src/runner.mjs.
const NOW_MS = Date.parse('2026-06-13T00:00:00Z');

const DEMO_TAG = '[DEMO SEED]';

// ---------------------------------------------------------------------------
// tiny console helpers (no deps)
// ---------------------------------------------------------------------------
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (s, ...codes) => (useColor ? codes.join('') + s + C.reset : s);
const log = (...a) => console.log(...a);

// ---------------------------------------------------------------------------
// Human-friendly demo identities, keyed by ERC-8004 id from the fixtures.
// The id/address/x402 are NOT invented here — they come from the reputation
// fixtures. Only the display name/avatar/topic (cosmetic) live here, so the
// marketplace cards read nicely. If an id is missing from this map we still
// seed it with a generated name (the set stays in lock-step with reputation).
// ---------------------------------------------------------------------------
const PROFILES = {
  101: {
    name: 'Helix Research Agent',
    topic: 'research',
    skillName: 'summarize',
    blurb: 'Deep research + source-cited summaries.',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=helix-101',
  },
  102: {
    name: 'Quill Copywriter',
    topic: 'content',
    skillName: 'write',
    blurb: 'On-brand long-form and social copy.',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=quill-102',
  },
  103: {
    name: 'Vector Swap Agent',
    topic: 'defi',
    skillName: 'swap-quote',
    blurb: 'Best-route token swap quotes (Uniswap).',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=vector-103',
  },
  104: {
    name: 'Atlas Data Labeler',
    topic: 'data',
    skillName: 'label',
    blurb: 'Human-grade dataset labeling & QA.',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=atlas-104',
  },
  105: {
    name: 'Nova Translation Agent',
    topic: 'translation',
    skillName: 'translate',
    blurb: 'Fast, fluent multi-language translation.',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=nova-105',
  },
};

/** Deterministic fallback profile for any reputation id not in PROFILES. */
function profileFor(erc8004Id) {
  return (
    PROFILES[erc8004Id] || {
      name: `ActFlow Agent #${erc8004Id}`,
      topic: 'general',
      skillName: 'task',
      blurb: 'General-purpose ActFlow agent.',
      avatar: `https://api.dicebear.com/9.x/bottts/svg?seed=agent-${erc8004Id}`,
    }
  );
}

// ---------------------------------------------------------------------------
// Build the canonical agent set from the reputation fixtures themselves.
// This is THE shared source of truth with /leaderboard.
// ---------------------------------------------------------------------------
function buildSeedAgents() {
  const dataset = loadFixtureDataset(); // source:'fixture' — same files /leaderboard ranks
  const ranked = rankAgents({
    registrations: dataset.registrations,
    feedback: dataset.feedback,
    revokedFeedback: dataset.revokedFeedback,
    validations: dataset.validations,
    activity: dataset.activity,
    source: dataset.source,
    nowMs: NOW_MS,
    halfLifeDays: 30,
    sparklineBuckets: 14,
  });

  return ranked
    .filter((a) => a.address && a.address.startsWith('0x'))
    .map((a) => {
      const p = profileFor(a.erc8004Id);
      // Marketplace agentId === ERC-8004 owner address (lowercased): THE join key.
      const agentId = a.address.toLowerCase();

      // Demo statistics derived deterministically from the reputation breakdown,
      // so the marketplace card and the leaderboard tell the same story.
      const fb = a.breakdown.feedbackCount;
      const tasksCompleted = fb * 4; // a few tasks per piece of feedback
      const averageRating = Math.round(a.breakdown.averageValue * 10) / 10; // 0-5 stars
      const totalRatings = fb;
      const successRate = Math.min(100, 80 + fb * 4);
      // Earnings scale with tasks; x402-payable agents bill in USDC micro-amounts.
      const totalEarnings = String(tasksCompleted * (a.x402 ? 50000 : 25000)); // base units

      const skill = {
        enabled: true,
        fee: a.x402 ? '50000' : '25000', // 0.05 / 0.025 USDC (6dp) base units
        executionDuration: 120,
        skillName: p.skillName,
        autoAssign: true,
      };

      const metadata = {
        profileType: 'ai_agent',
        name: p.name,
        description: `${DEMO_TAG} ${p.blurb} (ERC-8004 #${a.erc8004Id}; ${
          a.x402 ? 'x402-payable' : 'free/non-x402'
        }; reputation score ${a.score.toFixed(2)})`,
        avatar: p.avatar,
        socialUrl: a.agentUri ?? undefined,
        skills: [skill],
        isFeatured: a.erc8004Id === ranked[0]?.erc8004Id, // feature the top agent
        isPlatformManaged: true,
        isValid: true,
      };

      const agent = {
        agentId, // == reputation owner_address (lc): the merge key
        topic: p.topic,
        skills: [skill],
        // Required so the /discover `isValid:false` filter (isMetadataDefault:false
        // AND isBlockchainConfirmed:true) returns the agent. See agent.service.ts.
        isMetadataDefault: false,
        isBlockchainConfirmed: true,
        isPaused: false,
        isDeleted: false,
        isFeatured: metadata.isFeatured,
        ipAssetId: 'No IP Asset ID',
        canNftTokenId: 'No NFT Token ID',
        licenseTermsId: 'No License Terms ID',
        // ERC-8004 / ENS identity columns the marketplace schema carries.
        erc8004Id: String(a.erc8004Id),
        identityStatus: 'dry-run',
        invitedTaskIds: [],
        assignedTaskIds: [],
        completedTaskIds: [],
        statistics: {
          totalTasksCompleted: tasksCompleted,
          totalEarnings,
          automaticTasksCompleted: tasksCompleted,
          manualTasksCompleted: 0,
          averageRating,
          totalRatings,
          successRate,
          averageCompletionTime: 120,
          lastActiveTimestamp: String(NOW_MS),
        },
      };

      return { reputation: a, metadata, agent };
    });
}

// ---------------------------------------------------------------------------
// dry-run printer (no DB)
// ---------------------------------------------------------------------------
function printDryRun(seeds) {
  log(
    paint('\nActFlow demo seed', C.bold, C.cyan) +
      paint('  (DRY RUN — no database writes)', C.dim),
  );
  log(paint(`Source: @actflow/reputation fixtures (source:fixture)`, C.dim));
  log(
    paint(
      `Would upsert ${seeds.length} agent(s) into ${AGENTS_COLLECTION} + ` +
        `${METADATA_COLLECTION} at ${MONGO_URI}\n`,
      C.dim,
    ),
  );
  for (const s of seeds) {
    log(
      '  ' +
        paint(s.metadata.name, C.bold) +
        paint(
          `  erc8004=#${s.reputation.erc8004Id}  x402=${s.reputation.x402}  ` +
            `score=${s.reputation.score.toFixed(2)}`,
          C.dim,
        ),
    );
    log(
      paint(
        `      agentId(=owner addr) = ${s.agent.agentId}`,
        C.dim,
      ),
    );
    log(
      paint(
        `      tasks=${s.agent.statistics.totalTasksCompleted} ` +
          `rating=${s.agent.statistics.averageRating} ` +
          `earnings=${s.agent.statistics.totalEarnings} (base units)`,
        C.dim,
      ),
    );
  }
  const x402 = seeds.filter((s) => s.reputation.x402).length;
  log(
    '\n' +
      paint(
        `DRY RUN OK — ${seeds.length} agents (${x402} x402-payable). ` +
          `Run without --dry-run to write to MongoDB.\n`,
        C.bold,
        C.green,
      ),
  );
}

// ---------------------------------------------------------------------------
// live seed (Mongo upsert)
// ---------------------------------------------------------------------------
async function seedToMongo(seeds) {
  // Imported lazily so --dry-run never needs the driver resolved at module load.
  const { MongoClient } = await import('mongodb');

  log(
    paint('\nActFlow demo seed', C.bold, C.cyan) +
      paint(`  -> ${MONGO_URI}`, C.dim),
  );

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  try {
    const db = client.db(); // db name comes from the URI path (…/actflow)
    const agents = db.collection(AGENTS_COLLECTION);
    const metas = db.collection(METADATA_COLLECTION);

    let upserts = 0;
    for (const s of seeds) {
      // 1) Upsert metadata first; we need its _id to link from the agent.
      //    Idempotent key: a stable demo name + the join address.
      const metaFilter = {
        name: s.metadata.name,
        'demoSeed.agentId': s.agent.agentId,
      };
      const metaDoc = {
        ...s.metadata,
        demoSeed: { agentId: s.agent.agentId, erc8004Id: s.reputation.erc8004Id },
      };
      await metas.updateOne(
        metaFilter,
        { $set: metaDoc },
        { upsert: true },
      );
      const meta = await metas.findOne(metaFilter, { projection: { _id: 1 } });

      // 2) Upsert the agent, linking metadataId -> the metadata _id.
      await agents.updateOne(
        { agentId: s.agent.agentId },
        {
          $set: {
            ...s.agent,
            metadataId: meta._id,
            demoSeed: true,
          },
        },
        { upsert: true },
      );
      upserts += 1;
      log(
        '  ' +
          paint('upserted', C.green) +
          ` ${s.metadata.name} ` +
          paint(
            `(agentId=${s.agent.agentId}, erc8004=#${s.reputation.erc8004Id}, x402=${s.reputation.x402})`,
            C.dim,
          ),
      );
    }

    const total = await agents.countDocuments({ demoSeed: true });
    log(
      '\n' +
        paint(
          `SEED OK — upserted ${upserts} demo agents ` +
            `(${total} demo agents now in ${AGENTS_COLLECTION}).`,
          C.bold,
          C.green,
        ),
    );
    log(
      paint(
        '/discover and /leaderboard now list the SAME agents (merged by address).\n',
        C.dim,
      ),
    );
  } finally {
    await client.close();
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const seeds = buildSeedAgents();
  if (seeds.length === 0) {
    throw new Error(
      'No agents derived from reputation fixtures — is @actflow/reputation built?',
    );
  }
  if (DRY_RUN) {
    printDryRun(seeds);
    return;
  }
  await seedToMongo(seeds);
}

main().catch((err) => {
  console.error('\n' + paint('SEED FAILED', C.bold, C.red));
  console.error(paint(`   ${err?.message ?? err}`, C.red));
  if (
    /ECONNREFUSED|ENOTFOUND|connect|topology|ETIMEDOUT/i.test(
      String(err?.message ?? ''),
    )
  ) {
    console.error(
      paint(
        '   Hint: start MongoDB first (see docs/hackathon/RUNBOOK.md), or use --dry-run.',
        C.yellow,
      ),
    );
  }
  process.exit(1);
});
