import assert from "node:assert/strict";
import { test } from "node:test";
import {
  encodeAgentRecords,
  decodeAgentRecords,
  agentEndpointKey,
  agentRegistrationKey,
  parseAgentRegistrationKey,
  VERIFIED_KEYS,
  DEFAULT_UNVERIFIED_KEYS,
  type AgentProfile,
} from "../records.js";

/**
 * UNIT: the pure encode/decode core. Keys here are pinned to the ens-agents
 * SKILL (ENSIP-25/26 + ENSIP-5 common keys); UNVERIFIED custom keys use the
 * documented collision-avoiding prefix and are tested via the defaults.
 */

test("encode produces the exact ENSIP-25/26 + ENSIP-5 key strings", () => {
  const profile: AgentProfile = {
    context: "ActFlow research agent.",
    description: "Research agent",
    url: "https://agents.actflow.example/agent1",
    avatar: "https://agents.actflow.example/agent1/avatar.png",
    endpoints: {
      a2a: "https://agents.actflow.example/agent1/a2a",
      mcp: "https://agents.actflow.example/agent1/mcp",
    },
    registration: {
      registry:
        "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432",
      agentId: "167",
    },
    capabilities: ["research", "summarize"],
    x402: true,
    pricing: "0.50 USDC/task",
  };

  const pairs = encodeAgentRecords(profile);
  const map = new Map(pairs);

  assert.equal(map.get(VERIFIED_KEYS.agentContext), "ActFlow research agent.");
  assert.equal(map.get(VERIFIED_KEYS.description), "Research agent");
  assert.equal(map.get(VERIFIED_KEYS.url), "https://agents.actflow.example/agent1");
  assert.equal(
    map.get(VERIFIED_KEYS.avatar),
    "https://agents.actflow.example/agent1/avatar.png",
  );
  assert.equal(
    map.get("agent-endpoint[a2a]"),
    "https://agents.actflow.example/agent1/a2a",
  );
  assert.equal(
    map.get("agent-endpoint[mcp]"),
    "https://agents.actflow.example/agent1/mcp",
  );
  // ENSIP-25: value defaults to "1" when not provided.
  assert.equal(
    map.get(
      "agent-registration[0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432][167]",
    ),
    "1",
  );
  // UNVERIFIED custom keys (defaults).
  assert.equal(map.get(DEFAULT_UNVERIFIED_KEYS.capabilities), "research,summarize");
  assert.equal(map.get(DEFAULT_UNVERIFIED_KEYS.x402), "true");
  assert.equal(map.get(DEFAULT_UNVERIFIED_KEYS.pricing), "0.50 USDC/task");
});

test("encode -> decode round-trips a full profile", () => {
  const profile: AgentProfile = {
    context: "ctx",
    description: "desc",
    url: "https://example.com",
    avatar: "ipfs://cid",
    endpoints: {
      a2a: "https://example.com/a2a",
      mcp: "https://example.com/mcp",
      web: "https://example.com",
    },
    registration: {
      registry: "0x0001000001011480deadbeef",
      agentId: "42",
      value: "1",
    },
    capabilities: ["a", "b", "c"],
    x402: false,
    pricing: "free",
  };

  const decoded = decodeAgentRecords(encodeAgentRecords(profile));
  assert.deepEqual(decoded, profile);
});

test("round-trips through a string Map (simulating on-chain text reads)", () => {
  const profile: AgentProfile = {
    context: "agent",
    endpoints: { mcp: "https://x/mcp" },
    capabilities: ["x"],
    x402: true,
  };
  const onChain = new Map(encodeAgentRecords(profile));
  // Re-read in arbitrary order; ENS returns "" for unset keys (skipped).
  const reread: Array<[string, string]> = [
    ["agent-context", onChain.get("agent-context")!],
    ["description", ""], // unset → skipped
    [DEFAULT_UNVERIFIED_KEYS.x402, onChain.get(DEFAULT_UNVERIFIED_KEYS.x402)!],
    ["agent-endpoint[mcp]", onChain.get("agent-endpoint[mcp]")!],
    [DEFAULT_UNVERIFIED_KEYS.capabilities, onChain.get(DEFAULT_UNVERIFIED_KEYS.capabilities)!],
  ];
  const decoded = decodeAgentRecords(reread);
  assert.deepEqual(decoded, profile);
});

test("encode omits absent fields entirely", () => {
  const pairs = encodeAgentRecords({ context: "only context" });
  assert.deepEqual(pairs, [["agent-context", "only context"]]);
});

test("custom keys can be overridden (UNVERIFIED keys are config-driven)", () => {
  const unverifiedKeys = {
    capabilities: "org.example.caps",
    x402: "org.example.x402",
    pricing: "org.example.price",
  };
  const profile: AgentProfile = { capabilities: ["z"], x402: true, pricing: "p" };
  const pairs = encodeAgentRecords(profile, { unverifiedKeys });
  const map = new Map(pairs);
  assert.equal(map.get("org.example.caps"), "z");
  assert.equal(map.get("org.example.x402"), "true");
  assert.equal(map.get("org.example.price"), "p");
  // decode with the same override recovers the profile
  assert.deepEqual(decodeAgentRecords(pairs, { unverifiedKeys }), profile);
});

test("agentRegistrationKey rejects '[' or ']' in agentId (ENSIP-25)", () => {
  assert.throws(() => agentRegistrationKey("0xabc", "16[7"));
  assert.throws(() => agentRegistrationKey("0xabc", "1]"));
  assert.equal(
    agentRegistrationKey("0xabc", "167"),
    "agent-registration[0xabc][167]",
  );
});

test("parseAgentRegistrationKey round-trips with agentRegistrationKey", () => {
  const key = agentRegistrationKey(
    "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432",
    "167",
  );
  assert.deepEqual(parseAgentRegistrationKey(key), {
    registry: "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432",
    agentId: "167",
  });
  assert.equal(parseAgentRegistrationKey("not-a-reg-key"), null);
});

test("agentEndpointKey formats ENSIP-26 protocol keys", () => {
  assert.equal(agentEndpointKey("a2a"), "agent-endpoint[a2a]");
  assert.equal(agentEndpointKey("mcp"), "agent-endpoint[mcp]");
  assert.equal(agentEndpointKey("web"), "agent-endpoint[web]");
});

test("decode treats empty-string values as unset", () => {
  const decoded = decodeAgentRecords([
    ["agent-context", ""],
    ["url", ""],
    ["description", "present"],
  ]);
  assert.deepEqual(decoded, { description: "present" });
});
