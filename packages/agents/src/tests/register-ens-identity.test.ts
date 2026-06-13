import assert from "node:assert/strict";
import { test } from "node:test";
import {
  nameToNode,
  subnameString,
  loadEnsConfig,
} from "@actflow/integrations-ens";
import {
  registerEnsIdentity,
  type RegisterEnsIdentityInput,
} from "../identity/register-ens-identity.js";

// Deterministic env for the dry run — NO RPC, NO wallet → no network at all.
// Values come from this object, not from the ambient process.env, so the test
// is hermetic and never depends on (or hits) a live endpoint.
const PARENT = "actflow.eth";
function env(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ENS_PARENT_NAME: PARENT,
    ENS_CHAIN: "mainnet",
    ...extra,
  };
}

const baseInput: RegisterEnsIdentityInput = {
  slug: "research-agent",
  address: "0x1111111111111111111111111111111111111111",
  endpoint: "https://agents.example/research-agent/a2a",
  topics: ["research", "summarize"],
  pricing: "0.5 USDC/task",
  x402: true,
};

test("dry run (walletClient=null): assembles identity with no network call", async () => {
  const result = await registerEnsIdentity(baseInput, null, { env: env() });

  assert.equal(result.dryRun, true);
  assert.equal(result.mintTxHash, undefined);
  assert.equal(result.written, undefined);

  // Full ENS name = <slug>.<parentName> (normalized).
  assert.equal(result.ensName, subnameString(PARENT, baseInput.slug));
  assert.equal(result.ensName, "research-agent.actflow.eth");
});

test("dry run: returned ensNode equals the namehash of the full name", async () => {
  const result = await registerEnsIdentity(baseInput, null, { env: env() });

  // Independently recompute the namehash via the ENS lib (viem under the hood)
  // and require an exact bytes32 match — this is the node passed to
  // AgentIdentityExtension.setIdentity(ensNode, ...).
  const expectedNode = nameToNode(`${baseInput.slug}.${PARENT}`);
  assert.equal(result.ensNode, expectedNode);
  assert.match(result.ensNode, /^0x[0-9a-f]{64}$/);
});

test("dry run: text records are assembled from the onboarding input", async () => {
  const result = await registerEnsIdentity(baseInput, null, { env: env() });
  const map = new Map(result.records);

  // ENSIP-26 agent-context (free-form) present + mentions the endpoint.
  const context = map.get("agent-context");
  assert.ok(context && context.includes(baseInput.endpoint!));

  // ENSIP-26 endpoint record for the default protocol (a2a).
  assert.equal(map.get("agent-endpoint[a2a]"), baseInput.endpoint);

  // UNVERIFIED custom keys (defaults from integrations-ens).
  assert.equal(map.get("actflow.capabilities"), "research,summarize");
  assert.equal(map.get("actflow.x402"), "true");
  assert.equal(map.get("actflow.pricing"), "0.5 USDC/task");

  // No ERC-8004 id / registry → NO ENSIP-25 registration record invented.
  assert.equal(
    [...map.keys()].some((k) => k.startsWith("agent-registration[")),
    false,
  );
});

test("dry run: ENSIP-25 registration only when erc8004Id AND registry are provided", async () => {
  // ERC-7930 interoperable registry address supplied via env (never hard-coded
  // in source). agentId comes from erc8004Id.
  const registry =
    "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432";
  const result = await registerEnsIdentity(
    { ...baseInput, erc8004Id: 167 },
    null,
    { env: env({ ENS_AGENT_REGISTRY: registry }) },
  );

  assert.equal(result.erc8004Id, "167");
  const key = `agent-registration[${registry}][167]`;
  const map = new Map(result.records);
  assert.equal(map.get(key), "1"); // ENSIP-25 recommended value.
});

test("dry run: erc8004Id WITHOUT a registry writes no registration record", async () => {
  const result = await registerEnsIdentity(
    { ...baseInput, erc8004Id: 167 },
    null,
    { env: env() }, // no ENS_AGENT_REGISTRY
  );
  assert.equal(result.erc8004Id, "167"); // still echoed for on-chain setIdentity
  assert.equal(
    [...new Map(result.records).keys()].some((k) =>
      k.startsWith("agent-registration["),
    ),
    false,
  );
});

test("dry run forced when no parent name configured (network never reachable)", async () => {
  // No ENS_PARENT_NAME → cannot derive a subname; falls back to a label-only
  // placeholder + zero node, still dryRun, still no network.
  const result = await registerEnsIdentity(baseInput, null, {
    env: { ENS_CHAIN: "mainnet" },
  });
  assert.equal(result.dryRun, true);
  assert.equal(result.ensName, baseInput.slug);
  assert.equal(
    result.ensNode,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
});

test("loadEnsConfig honors the injected env (no parent name required for reads)", () => {
  const config = loadEnsConfig(env());
  assert.equal(config.parentName, PARENT);
  assert.equal(config.network, "mainnet");
});
