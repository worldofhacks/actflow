#!/usr/bin/env node
/**
 * actflow-register-agents — provision identities for the 3 first-party agents.
 *
 * Runs provisionAgent() for swap-agent, research-agent and actle: ERC-8004
 * IdentityRegistry registration + ENS subname/records + the
 * AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName) args. Prints a
 * table (or JSON with --json).
 *
 * DRY RUN by default — and STILL a dry run unless ALL prerequisites are present:
 *   - ENS step needs ENS_PARENT_NAME (+ a funded wallet that owns the wrapped
 *     parent) to mint a real subname.
 *   - ERC-8004 step needs a resolved IdentityRegistry (env
 *     ERC8004_IDENTITY_REGISTRY or a known deployment for ERC8004_CHAIN_ID, which
 *     defaults to Arc Testnet 5042002) AND a funded wallet to send register().
 *
 * No private key is read here unless one is supplied via --private-key or the
 * AGENT_PROVISION_PRIVATE_KEY env var (never hard-coded). With no key, no wallet
 * client is built and every step is a labeled dry run — safe to run with no
 * funds/creds. No secrets are printed.
 *
 * Usage:
 *   actflow-register-agents [--json] [--parent <ens-parent>]
 *                           [--endpoint-base <url>] [--private-key <0x..>]
 *                           [--chain-id <n>] [--registry <0x..>]
 *
 * Env: ENS_PARENT_NAME, ENS_CHAIN, ENS_AGENT_REGISTRY (ERC-7930),
 *      ERC8004_IDENTITY_REGISTRY, ERC8004_CHAIN_ID, ARC_TESTNET_RPC_URL,
 *      AGENT_PROVISION_PRIVATE_KEY.
 */
import {
  provisionAgent,
  type ProvisionAgentInput,
  type ProvisionAgentResult,
} from "../identity/provision-agent.js";
import { listAgents } from "../agents/registry.js";

interface Args {
  json: boolean;
  help: boolean;
  parent?: string;
  endpointBase?: string;
  privateKey?: string;
  chainId?: number;
  registry?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--parent") out.parent = argv[++i];
    else if (a === "--endpoint-base") out.endpointBase = argv[++i];
    else if (a === "--private-key") out.privateKey = argv[++i];
    else if (a === "--registry") out.registry = argv[++i];
    else if (a === "--chain-id") out.chainId = Number(argv[++i]);
  }
  return out;
}

const HELP = `actflow-register-agents — provision ERC-8004 + ENS identity for the first-party agents.

Usage:
  actflow-register-agents [--json] [--parent <ens-parent>] [--endpoint-base <url>]
                          [--private-key <0x..>] [--chain-id <n>] [--registry <0x..>]

Modes:
  dry-run  (default)  no funded key OR missing registry/parent -> assembles
                      identity + setIdentity args WITHOUT any tx (no funds needed)
  live                funded key (--private-key / AGENT_PROVISION_PRIVATE_KEY)
                      + resolved ERC-8004 registry + ENS parent -> sends txs

Env: ENS_PARENT_NAME, ENS_CHAIN, ENS_AGENT_REGISTRY, ERC8004_IDENTITY_REGISTRY,
     ERC8004_CHAIN_ID (default Arc Testnet 5042002), ARC_TESTNET_RPC_URL,
     AGENT_PROVISION_PRIVATE_KEY.
`;

/** Slugs of the first-party agents to provision, in display order. */
const FIRST_PARTY_SLUGS = ["swap-agent", "research-agent", "actle"] as const;

/**
 * Build a viem WalletClient on Arc testnet from a private key, lazily importing
 * the SDK helper so the CLI loads (and dry-runs) even if no key/funds exist.
 * Returns null when no key is supplied — forcing the safe dry-run path.
 */
async function buildWalletClient(
  privateKey: string | undefined,
  rpcUrl: string | undefined,
): Promise<any | null> {
  if (!privateKey) return null;
  const { getArcWalletClient } = await import("@actflow/sdk");
  return getArcWalletClient({
    privateKey: privateKey as `0x${string}`,
    rpcUrl,
  }) as unknown as any;
}

/** One row of the printed table. */
interface Row {
  slug: string;
  mode: "dry-run" | "live";
  ensName: string;
  ensNode: string;
  erc8004Id: string;
  registry: string;
  chainId: number;
}

function toRow(slug: string, r: ProvisionAgentResult): Row {
  return {
    slug,
    mode: r.dryRun ? "dry-run" : "live",
    ensName: r.ensName,
    ensNode: r.ensNode,
    erc8004Id: r.erc8004Id ?? "(pending)",
    registry: r.erc8004.registryAddress ?? "(none)",
    chainId: r.erc8004.chainId,
  };
}

function printTable(rows: Row[]): void {
  const cols: Array<{ key: keyof Row; header: string }> = [
    { key: "slug", header: "slug" },
    { key: "mode", header: "mode" },
    { key: "ensName", header: "ensName" },
    { key: "erc8004Id", header: "erc8004Id" },
    { key: "chainId", header: "chainId" },
    { key: "registry", header: "registry" },
    { key: "ensNode", header: "ensNode" },
  ];
  const widths = cols.map((c) =>
    Math.max(c.header.length, ...rows.map((r) => String(r[c.key]).length)),
  );
  const fmt = (vals: string[]) =>
    vals.map((v, i) => v.padEnd(widths[i])).join("  ");
  process.stdout.write(fmt(cols.map((c) => c.header)) + "\n");
  process.stdout.write(widths.map((w) => "-".repeat(w)).join("  ") + "\n");
  for (const r of rows) {
    process.stdout.write(fmt(cols.map((c) => String(r[c.key]))) + "\n");
  }
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const env: NodeJS.ProcessEnv = { ...process.env };
  if (args.parent) env.ENS_PARENT_NAME = args.parent;

  const privateKey = args.privateKey ?? env.AGENT_PROVISION_PRIVATE_KEY;
  const rpcUrl = env.ARC_TESTNET_RPC_URL;

  let walletClient: any = null;
  try {
    walletClient = await buildWalletClient(privateKey, rpcUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `actflow-register-agents: could not build wallet client (${msg}); continuing in dry-run.\n`,
    );
    walletClient = null;
  }

  // Resolve the registered first-party agents (skip any not found, defensively).
  const bySlug = new Map(listAgents().map((a) => [a.slug, a]));

  const rows: Row[] = [];
  const results: Record<string, ProvisionAgentResult> = {};

  for (const slug of FIRST_PARTY_SLUGS) {
    const agent = bySlug.get(slug);
    if (!agent) {
      process.stderr.write(`actflow-register-agents: agent "${slug}" not found in registry; skipping.\n`);
      continue;
    }
    const endpoint = args.endpointBase
      ? `${args.endpointBase.replace(/\/$/, "")}/${slug}/a2a`
      : undefined;

    const input: ProvisionAgentInput = {
      slug,
      address: (agent.walletConfig?.address as `0x${string}`) ??
        // No public address configured → placeholder zero address. The owner is
        // actually set by the wallet client's account in the live path; in dry
        // run this is only used for display / addr-record assembly.
        ("0x0000000000000000000000000000000000000000" as `0x${string}`),
      endpoint,
      topics: agent.topics,
      pricing: undefined,
      x402: true,
      context: agent.description,
    };

    const result = await provisionAgent(input, {
      walletClient,
      env,
      erc8004: {
        env,
        chainId: args.chainId,
        registryAddress: args.registry as `0x${string}` | undefined,
      },
    });
    results[slug] = result;
    rows.push(toRow(slug, result));
  }

  if (args.json) {
    process.stdout.write(JSON.stringify(results, null, 2) + "\n");
  } else {
    const anyLive = rows.some((r) => r.mode === "live");
    process.stdout.write(
      anyLive
        ? "ActFlow first-party agent identities (LIVE — txs submitted):\n\n"
        : "ActFlow first-party agent identities (DRY RUN — no tx, no funds needed):\n\n",
    );
    printTable(rows);
    process.stdout.write(
      "\nNext: call AgentIdentityExtension.setIdentity(ensNode, erc8004Id, ensName) per row to bind on-chain.\n",
    );
  }
  return 0;
}

// Run only when invoked directly (not when imported by a test).
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().then((code) => process.exit(code));
}
