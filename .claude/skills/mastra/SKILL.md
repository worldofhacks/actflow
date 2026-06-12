---
name: mastra
description: Mastra v1.x TypeScript agent framework — Agent/createTool/Memory/workflows/MCPClient APIs and Next.js streaming integration. Use when building, wiring, or debugging ActFlow marketplace agents (defining agents, zod tools, memory, MCP server connections, or streaming agent chat through a Next.js route).
---

# Mastra v1.x — TS Agent Framework (ActFlow marketplace agents)

ActFlow agents (hired per-task, paid in USDC, Privy wallets) run on Mastra. This skill covers
the v1 API surface verified against official docs on 2026-06-12.

## Setup & Auth

Scaffold a new project (interactive — picks provider, writes API key):

```bash
npm create mastra@latest        # also: pnpm create mastra | yarn create mastra | bunx create-mastra
```

Manual install (from https://mastra.ai/docs/getting-started/manual-install):

```bash
npm install -D typescript @types/node mastra@latest
npm install @mastra/core@latest zod@^4          # zod v4 required
npm install @mastra/memory@latest @mastra/libsql@latest   # memory + storage adapter
npm install @mastra/mcp@latest                  # MCPClient / MCPServer
npm install @mastra/ai-sdk@latest @ai-sdk/react ai        # Next.js / AI SDK v5 UI streaming
```

Published versions on npm as of 2026-06-12 (`npm view <pkg> version`):
`@mastra/core` 1.42.0 · `mastra` (CLI) 1.13.0 · `@mastra/memory` 1.20.3 · `@mastra/mcp` 1.10.0 · `@mastra/ai-sdk` 1.4.5 · `@mastra/libsql` 1.13.0

Env vars: one key for your model provider. Docs example uses `GOOGLE_API_KEY=<your-api-key>`
(manual-install page). Other provider var names: NOT FOUND IN DOCS — check https://mastra.ai/models per provider.

tsconfig: docs state "Mastra requires modern `module` and `moduleResolution` settings. Using
`CommonJS` or `node` will cause resolution errors." Set `module: "ES2022"`, `moduleResolution: "bundler"`.

package.json scripts: `"dev": "mastra dev"`, `"build": "mastra build"`. `mastra dev` runs the
standalone dev server + Studio; for ActFlow we instead embed the Mastra instance in Next.js
(import it in route handlers) — both can run side by side (see Gotchas on db paths).

## Core API

All signatures copied from fetched docs — param names are exact.

**Agent** (`import { Agent } from '@mastra/core/agent'`):

```ts
new Agent({
  id: 'test-agent',
  name: 'Test Agent',
  instructions: 'You are a helpful assistant.',
  model: 'openai/gpt-5.5',          // 'provider/model-name' via Mastra's model router
  tools: { weatherTool },            // map of createTool results (and/or MCP tools)
  memory: new Memory({ options: { lastMessages: 20 } }),
})
```

```ts
const response = await agent.generate('Help me organize my day')   // response.text
const stream  = await agent.stream('Help me organize my day')
for await (const chunk of stream.textStream) process.stdout.write(chunk)

// Memory ids at call time:
await agent.generate('message', { memory: { resource: 'user-123', thread: 'conversation-123' } })
// Dynamic MCP tools at call time:
await agent.stream(prompt, { toolsets: await mcp.listToolsets() })
```

**createTool** (`import { createTool } from '@mastra/core/tools'`; zod schemas):

```ts
createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({ location: z.string().describe('City name') }),
  outputSchema: z.object({ output: z.string() }),
  // execute receives the VALIDATED INPUT DATA as its first parameter (optional execution
  // context object is second) — destructure input fields directly:
  execute: async ({ location }) => ({ output: `Weather in ${location}: ...` }),
})
```

**Mastra instance + storage** (`import { Mastra } from '@mastra/core'`):

```ts
export const mastra = new Mastra({
  agents: { testAgent },
  workflows: { testWorkflow },
  storage: new LibSQLStore({ id: 'mastra-storage', url: ':memory:' }),  // backs Memory
})
const agent = mastra.getAgentById('test-agent')
```

**Memory** (`import { Memory } from '@mastra/memory'`): options include `lastMessages`,
`semanticRecall`, `workingMemory`, `observationalMemory`. History read-back:
`await agent.getMemory()` then `memory.recall({ threadId, resourceId })`.

**Workflows** (`import { createWorkflow, createStep } from "@mastra/core/workflows"`):

```ts
const step1 = createStep({
  id: 'step-1',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => ({ formatted: inputData.message.toUpperCase() }),
})
export const testWorkflow = createWorkflow({
  id: 'test-workflow',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ output: z.string() }),
}).then(step1).commit()

const run = await testWorkflow.createRun()
const result = await run.start({ inputData: { message: 'Hello world' } })
// or: const s = run.stream({ inputData: {...} }); for await (const c of s.fullStream) {...}; await s.result
```

**MCPClient** (`import { MCPClient } from '@mastra/mcp'`) — constructor
`{ id?: string; servers: Record<string, MastraMCPServerDefinition>; timeout?: number }`
(timeout default 60000 ms):

```ts
export const mcp = new MCPClient({
  id: 'actflow-mcp-client',
  servers: {
    wikipedia: { command: 'npx', args: ['-y', 'wikipedia-mcp'] },         // stdio
    weather:   { url: new URL(`https://server.smithery.ai/...?api_key=${process.env.SMITHERY_API_KEY}`) }, // HTTP
  },
})
// Static: tools fixed at agent definition (tool names namespaced "serverName_toolName")
new Agent({ id: 'a', tools: await mcp.listTools() })
// Dynamic per-request, then clean up:
await agent.generate(prompt, { toolsets: await mcp.listToolsets() })
await mcp.disconnect()
// Also: mcp.resources.list(), mcp.resources.read(serverName, uri), mcp.prompts.list(),
//       mcp.prompts.get({ serverName, name, args?, version? }), mcp.getServerInstructions()
```

**MCPServer** (expose ActFlow agents/tools to other MCP clients):
`new MCPServer({ id, name, version: '1.0.0', agents: {...}, tools: {...}, workflows: {...} })`.

**Next.js streaming** (`@mastra/ai-sdk`): `handleChatStream({ mastra, agentId, params })`
returns a stream consumed by `createUIMessageStreamResponse({ stream })` from `ai`;
`toAISdkV5Messages()` from `@mastra/ai-sdk/ui` converts recalled memory to UI messages.
Client uses `new DefaultChatTransport({ api: '/api/chat' })` with `useChat`. Full route in
the example below.

## Addresses & Chain Config

Mastra is a pure TypeScript framework — it has **no contract addresses, chain IDs, or RPC
endpoints**. Chain config for ActFlow (Arc USDC, ERC-8004, ENS) lives in the other skills;
never source on-chain values from Mastra docs.

- LibSQL in-memory storage URL: `url: ':memory:'` — https://mastra.ai/docs/memory/overview
- `mastra dev` Studio default port: NOT FOUND IN DOCS — verify before use (check terminal output of `mastra dev`)
- ActFlow local ports (project convention, from /home/actlabs/CLAUDE.md, not Mastra docs): Web 3400, Agent API 3401

## Gotchas

- **zod v4**: install docs pin `zod@^4`. zod v3 schemas in `createTool` are a version mismatch foot-gun.
- **tsconfig**: `module`/`moduleResolution` must be `ES2022`/`bundler`; `CommonJS`/`node` cause resolution errors (verbatim warning in manual-install docs).
- **`listTools()` vs `getTools()`**: v1 docs/reference use `listTools()`/`listToolsets()`. Many pre-v1 tutorials (and the deprecated `MastraMCPClient`) use `getTools()`/`getToolsets()` — don't copy those into a v1 project.
- **MCPClient memory leaks**: "Creating multiple instances with identical configurations without an `id` will throw an error to prevent memory leaks." Give each instance a unique `id`, or `await mcp.disconnect()` before recreating, or hoist to module scope. Matters in Next.js route handlers (hot reload re-evaluates modules).
- **Static MCP tools need top-level await** (`tools: await mcp.listTools()`) — ESM only; another reason for the tsconfig settings above.
- **Tool name collisions**: MCP tools are auto-namespaced — `serverName_toolName` in `listTools()` output, but `serverName.toolName` as `listToolsets()` object keys.
- **createTool `execute` arg shape changed in v1**: execute receives the validated input data as its **first parameter** (`execute: async ({ city }) => ...`). Pre-v1 tutorials destructure `{ context }` and read `context.city` — that shape is gone in v1; don't copy it.
- **`next dev` vs `mastra dev` db paths**: "Relative paths resolve based on each process's working directory, which differs between next dev and mastra dev" — use absolute paths in `LibSQLStore` config when running Studio alongside Next.js.
- **Memory needs both ids**: pass `memory: { resource, thread }` on every `generate`/`stream` call or history won't attach. For ActFlow: `resource` = hiring user/wallet, `thread` = task id.
- **Model strings**: `model: 'provider/model-name'` goes through Mastra's model router; the provider API key env var must be set or calls fail at runtime, not at construction.
- **Retrieval method is `mastra.getAgentById('id')`** (docs use the `id` field, not the display `name`).
- **MCPClient `timeout` default is 60000 ms** — raise it for slow tools (e.g. BigQuery-backed reputation MCP server).

## Minimal Working Example

ActFlow worker agent: one zod tool (task quote), memory, external MCP server tools, served
through a Next.js route. All API names verbatim from fetched docs.

```ts
// src/mastra/index.ts  (deps: @mastra/core @mastra/memory @mastra/libsql @mastra/mcp zod@^4)
import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { createTool } from '@mastra/core/tools'   // import path verbatim from manual-install docs
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'
import { MCPClient } from '@mastra/mcp'
import { z } from 'zod'

const quoteTool = createTool({
  id: 'quote-task',
  description: 'Quote a USDC price for a marketplace task',
  inputSchema: z.object({ task: z.string().describe('Task description') }),
  outputSchema: z.object({ output: z.string() }),
  execute: async ({ task }) => ({ output: `Quote for "${task}": 1.50 USDC` }), // v1: input data is the FIRST arg — destructure fields directly (pre-v1 `{ context }` shape is gone)
})

export const mcp = new MCPClient({
  id: 'actflow-mcp-client',
  servers: {
    payments: { url: new URL(process.env.PAYMENTS_MCP_URL!) }, // your x402/Arc MCP server
  },
})

export const workerAgent = new Agent({
  id: 'worker-agent',
  name: 'ActFlow Worker',
  instructions: 'You are a hired marketplace agent. Quote tasks before doing work.',
  model: 'openai/gpt-5.5',
  tools: { quoteTool, ...(await mcp.listTools()) },
  memory: new Memory({ options: { lastMessages: 20 } }),
})

export const mastra = new Mastra({
  agents: { workerAgent },
  storage: new LibSQLStore({ id: 'mastra-storage', url: 'file:/home/actlabs/actflow/.mastra/actflow.db' }), // absolute path on purpose
})
```

```ts
// src/app/api/chat/route.ts  (deps: @mastra/ai-sdk ai) — structure verbatim from Next.js guide
import { handleChatStream } from '@mastra/ai-sdk'
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '@/mastra'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const params = await req.json()
  const stream = await handleChatStream({
    mastra,
    agentId: 'worker-agent',
    params: { ...params, memory: { ...params.memory, thread: 'task-123', resource: 'hirer-wallet-0xabc' } },
  })
  return createUIMessageStreamResponse({ stream })
}

export async function GET() {
  const memory = await mastra.getAgentById('worker-agent').getMemory()
  let response = null
  try {
    response = await memory?.recall({ threadId: 'task-123', resourceId: 'hirer-wallet-0xabc' })
  } catch { console.log('No previous messages found.') }
  return NextResponse.json(toAISdkV5Messages(response?.messages || []))
}
```

## Sources

- https://mastra.ai/docs — fetched 2026-06-12
- https://mastra.ai/guides/getting-started/quickstart — fetched 2026-06-12
- https://mastra.ai/docs/getting-started/manual-install — fetched 2026-06-12
- https://mastra.ai/guides/getting-started/next-js — fetched 2026-06-12
- https://mastra.ai/docs/agents/overview — fetched 2026-06-12
- https://mastra.ai/docs/memory/overview — fetched 2026-06-12
- https://mastra.ai/docs/workflows/overview — fetched 2026-06-12
- https://mastra.ai/docs/mcp/overview — fetched 2026-06-12 (located via WebSearch; not linked from /docs landing)
- https://mastra.ai/reference/tools/mcp-client — fetched 2026-06-12
- https://mastra.ai/reference/tools/create-tool — fetched 2026-06-12 (execute signature: input data is first param)
- npm registry via `npm view <pkg> version` — queried 2026-06-12 (package versions only)
