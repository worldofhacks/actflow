import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MarketApiClient } from "../api-client";
import { registerGetAgentReputationTool } from "./get-agent-reputation.tool";
import { registerHireAgentTool } from "./hire-agent.tool";
import { toolRegistrars } from "./index";

/**
 * Light unit tests for the two new MCP tools (get-agent-reputation, hire-agent).
 *
 * These run with Node's built-in test runner (node --test) — the same pattern
 * as services/reputation and packages/agents — so NO new test dependency is
 * added. fetch is stubbed: there are NO live HTTP calls, NO funds, NO creds.
 * They prove the tools are registered, their input schemas validate, and the
 * handlers relay (and gracefully degrade) without fabricating any payment.
 */

// Minimal stub: these tools talk to their OWN base URLs, not the MarketApiClient.
const stubApiClient = {} as unknown as MarketApiClient;

/** Build a fresh server with all tools registered and return its tool map. */
function freshServer(): { server: McpServer; tools: Record<string, any> } {
  const server = new McpServer({ name: "test", version: "0.0.0" });
  for (const register of toolRegistrars) register(server, stubApiClient);
  // The SDK stores registered tools on this private map.
  const tools = (server as any)._registeredTools as Record<string, any>;
  return { server, tools };
}

type FetchArgs = { url: string; init?: RequestInit };
const realFetch = globalThis.fetch;
let fetchCalls: FetchArgs[] = [];

/** Replace global fetch with a controllable stub; record every call. */
function stubFetch(
  handler: (args: FetchArgs) => Response | Promise<Response>
): void {
  fetchCalls = [];
  globalThis.fetch = (async (input: any, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    fetchCalls.push({ url, init });
    return handler({ url, init });
  }) as typeof fetch;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.REPUTATION_URL;
  delete process.env.API_BASE_URL;
});

// --- registration -----------------------------------------------------------

test("both new tools are registered alongside the existing ones", () => {
  const { tools } = freshServer();
  for (const name of [
    "search-agents",
    "search-tasks",
    "resolve-ens-agent",
    "get-agent-reputation",
    "hire-agent",
  ]) {
    assert.ok(tools[name], `tool ${name} should be registered`);
  }
});

// --- input schema validation ------------------------------------------------

test("get-agent-reputation input schema validates { address }", () => {
  const { tools } = freshServer();
  const schema = tools["get-agent-reputation"].inputSchema;
  assert.ok(schema, "should expose an input schema");
  assert.equal(
    schema.safeParse({ address: "0xabc" }).success,
    true,
    "a string address is accepted"
  );
  assert.equal(
    schema.safeParse({}).success,
    false,
    "missing address is rejected"
  );
  assert.equal(
    schema.safeParse({ address: 123 }).success,
    false,
    "non-string address is rejected"
  );
});

test("hire-agent input schema validates optional fields", () => {
  const { tools } = freshServer();
  const schema = tools["hire-agent"].inputSchema;
  assert.ok(schema, "should expose an input schema");
  assert.equal(
    schema.safeParse({}).success,
    true,
    "all fields optional at the schema level"
  );
  assert.equal(
    schema.safeParse({
      agentAddress: "0xabc",
      resource: "task-1",
      topic: "t",
      price: "0.05",
      worldNullifier: "n",
    }).success,
    true,
    "a fully-specified hire is accepted"
  );
  assert.equal(
    schema.safeParse({ price: 5 }).success,
    false,
    "price must be a string"
  );
});

// --- get-agent-reputation handler ------------------------------------------

test("get-agent-reputation relays a RankedAgent from a reachable service", async () => {
  process.env.REPUTATION_URL = "http://rep.example";
  const ranked = {
    address: "0xABC",
    erc8004Id: 7,
    score: 88,
    breakdown: { feedbackCount: 3 },
    validations: 2,
    x402: true,
    source: "fixture",
  };
  stubFetch(({ url }) => {
    assert.equal(url, "http://rep.example/agents/0xABC/reputation");
    return jsonResponse(200, { source: "fixture", agent: ranked });
  });

  const server = new McpServer({ name: "t", version: "0" });
  registerGetAgentReputationTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["get-agent-reputation"];
  const res = await tool.handler({ address: "0xABC" });

  assert.equal(fetchCalls.length, 1, "exactly one HTTP call");
  assert.equal(res.isError, undefined);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.available, true);
  assert.equal(payload.found, true);
  assert.equal(payload.source, "fixture");
  assert.equal(payload.agent.score, 88);
  assert.equal(payload.agent.x402, true);
});

test("get-agent-reputation degrades gracefully when the service is unreachable", async () => {
  stubFetch(() => {
    throw new Error("ECONNREFUSED");
  });
  const server = new McpServer({ name: "t", version: "0" });
  registerGetAgentReputationTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["get-agent-reputation"];
  const res = await tool.handler({ address: "0xabc" });

  // Unreachable must NOT be a hard error.
  assert.equal(res.isError, undefined);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.available, false);
  assert.match(payload.reason, /unreachable/);
});

test("get-agent-reputation surfaces a 404 as found:false (not an error)", async () => {
  stubFetch(() => jsonResponse(404, { source: "fixture", error: "agent not found" }));
  const server = new McpServer({ name: "t", version: "0" });
  registerGetAgentReputationTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["get-agent-reputation"];
  const res = await tool.handler({ address: "0xabc" });

  assert.equal(res.isError, undefined);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.available, true);
  assert.equal(payload.found, false);
});

// --- hire-agent handler -----------------------------------------------------

test("hire-agent surfaces a 402 challenge verbatim (no fabricated payment)", async () => {
  process.env.API_BASE_URL = "http://api.example";
  const challenge = {
    status: 402,
    challenge: { amount: "50000", recipient: "0xRECIP", resource: "task-1" },
    settle: { endpoint: "/payments/settle", method: "POST" },
  };
  stubFetch(({ url, init }) => {
    assert.equal(url, "http://api.example/payments/hire");
    assert.equal(init?.method, "POST");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.resource, "task-1");
    assert.equal(body.agentAddress, "0xRECIP");
    return jsonResponse(402, challenge);
  });

  const server = new McpServer({ name: "t", version: "0" });
  registerHireAgentTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["hire-agent"];
  const res = await tool.handler({
    agentAddress: "0xRECIP",
    resource: "task-1",
  });

  assert.equal(res.isError, undefined);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.httpStatus, 402);
  assert.equal(payload.result.challenge.amount, "50000");
  // The tool must not invent a tx/receipt — only relay the challenge.
  assert.equal(payload.result.receipt, undefined);
});

test("hire-agent surfaces a 200 world-trial unlock", async () => {
  stubFetch(() =>
    jsonResponse(200, {
      status: 200,
      method: "world-trial",
      unlocked: true,
      freeTrialsRemaining: 1,
      receipt: { id: "r1", method: "world-trial", mock: true },
    })
  );
  const server = new McpServer({ name: "t", version: "0" });
  registerHireAgentTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["hire-agent"];
  const res = await tool.handler({
    agentAddress: "0xRECIP",
    resource: "task-1",
    worldNullifier: "nullifier-123",
  });

  assert.equal(res.isError, undefined);
  const payload = JSON.parse(res.content[0].text);
  assert.equal(payload.httpStatus, 200);
  assert.equal(payload.result.method, "world-trial");
  assert.equal(payload.result.receipt.mock, true, "world-trial receipt is mock");
});

test("hire-agent derives a resource from topic/agentAddress when omitted", async () => {
  let sentBody: any;
  stubFetch(({ init }) => {
    sentBody = JSON.parse(String(init?.body));
    return jsonResponse(402, { status: 402 });
  });
  const server = new McpServer({ name: "t", version: "0" });
  registerHireAgentTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["hire-agent"];

  await tool.handler({ topic: "research" });
  assert.equal(sentBody.resource, "research", "falls back to topic");

  await tool.handler({ agentAddress: "0xDEADBEEF" });
  assert.equal(
    sentBody.resource,
    "hire:0xDEADBEEF",
    "falls back to an agent-scoped resource"
  );
});

test("hire-agent errors when nothing identifies a resource", async () => {
  let called = false;
  stubFetch(() => {
    called = true;
    return jsonResponse(402, {});
  });
  const server = new McpServer({ name: "t", version: "0" });
  registerHireAgentTool(server, stubApiClient);
  const tool = (server as any)._registeredTools["hire-agent"];
  const res = await tool.handler({});

  assert.equal(res.isError, true);
  assert.equal(called, false, "no HTTP call is made without a resource");
});

// Restore even if a test throws before its afterEach (belt and suspenders).
beforeEach(() => {
  globalThis.fetch = realFetch;
});
