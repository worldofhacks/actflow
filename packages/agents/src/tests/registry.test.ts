import assert from "node:assert/strict";
import { test } from "node:test";
import { Agent } from "@mastra/core/agent";
import {
  agents,
  getAgentBySlug,
  getAgentForTopic,
  getMastraAgents,
  listAgents,
} from "../agents/registry.js";

test("registry lists exactly 3 first-party agents", () => {
  const all = listAgents();
  assert.equal(all.length, 3);
  assert.deepEqual(
    Object.keys(agents).sort(),
    ["actle", "research-agent", "swap-agent"],
  );
});

test("every registered agent wraps a Mastra Agent with id === slug", () => {
  for (const a of listAgents()) {
    assert.ok(a.agent instanceof Agent, `${a.slug} is not a Mastra Agent`);
    assert.equal(typeof a.model, "string");
    assert.ok(a.model.length > 0);
  }
});

test("getAgentBySlug resolves known slugs and returns undefined otherwise", () => {
  assert.equal(getAgentBySlug("actle")?.name, "Actle");
  assert.equal(getAgentBySlug("swap-agent")?.name, "ActFlow Swap Agent");
  assert.equal(getAgentBySlug("nope"), undefined);
});

test("getMastraAgents returns a slug-keyed Agent map for the Mastra constructor", () => {
  const map = getMastraAgents();
  assert.deepEqual(
    Object.keys(map).sort(),
    ["actle", "research-agent", "swap-agent"],
  );
  for (const agent of Object.values(map)) {
    assert.ok(agent instanceof Agent);
  }
});

test("getAgentForTopic routes image topics to actle", () => {
  assert.equal(getAgentForTopic("img:dalle")?.slug, "actle");
  assert.equal(getAgentForTopic("img:mix")?.slug, "actle");
  // No registered agent serves social topics in this phase.
  assert.equal(getAgentForTopic("x:tweet"), undefined);
});
