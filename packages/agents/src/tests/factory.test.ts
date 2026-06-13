import assert from "node:assert/strict";
import { test } from "node:test";
import { Agent } from "@mastra/core/agent";
import { resolveModel } from "../config/model.js";
import { defineActflowAgent } from "../core/define-actflow-agent.js";
import { createSwapTools } from "../tools/swap-tools.js";

test("defineActflowAgent creates a wrapped Mastra Agent", () => {
  const a = defineActflowAgent({
    slug: "test-agent",
    name: "Test Agent",
    instructions: "You are a test agent.",
  });

  assert.equal(a.slug, "test-agent");
  assert.equal(a.name, "Test Agent");
  assert.ok(a.agent instanceof Agent);
  assert.equal(a.model, resolveModel());
  assert.deepEqual(a.topics, []);
});

test("standard toolset (marketplace + wallet) is attached by default", () => {
  const a = defineActflowAgent({
    slug: "tooling-agent",
    name: "Tooling Agent",
    instructions: "x",
  });
  const keys = Object.keys(a.tools);
  for (const expected of ["acceptTask", "submitResult", "getBalance", "pay"]) {
    assert.ok(keys.includes(expected), `missing standard tool ${expected}`);
  }
});

test("agent-specific tools merge over the standard toolset", () => {
  const a = defineActflowAgent({
    slug: "swapper",
    name: "Swapper",
    instructions: "x",
    tools: createSwapTools(),
  });
  const keys = Object.keys(a.tools);
  assert.ok(keys.includes("swapQuote"));
  assert.ok(keys.includes("swapExecute"));
  assert.ok(keys.includes("acceptTask"));
});

test("includeStandardTools=false omits the standard toolset", () => {
  const a = defineActflowAgent({
    slug: "bare-agent",
    name: "Bare",
    instructions: "x",
    includeStandardTools: false,
  });
  assert.deepEqual(Object.keys(a.tools), []);
});

test("walletConfig and model override are preserved", () => {
  const a = defineActflowAgent({
    slug: "wallet-agent",
    name: "Wallet Agent",
    instructions: "x",
    model: "anthropic/claude-opus-4-8",
    walletConfig: { chainId: 1, privateKeyEnv: "WALLET_AGENT_PRIVATE_KEY" },
  });
  assert.equal(a.model, "anthropic/claude-opus-4-8");
  assert.equal(a.walletConfig?.chainId, 1);
  assert.equal(a.walletConfig?.privateKeyEnv, "WALLET_AGENT_PRIVATE_KEY");
});

test("invalid slug or empty instructions throw", () => {
  assert.throws(() =>
    defineActflowAgent({ slug: "Bad Slug!", name: "x", instructions: "x" }),
  );
  assert.throws(() =>
    defineActflowAgent({ slug: "ok-slug", name: "x", instructions: "   " }),
  );
});
