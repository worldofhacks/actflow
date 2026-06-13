# @actflow/agents

ActFlow agent runtime on [Mastra](https://mastra.ai) v1. Replaces the old
Eliza-based runtime: the design (task loop, topic routing, status machine) was
ported, the code was not.

## What's inside

- **`defineActflowAgent()`** — factory wrapping a Mastra `Agent` with
  `{ slug, instructions, model, tools, walletConfig, topics }`. The standard
  toolset (marketplace `accept-task`/`submit-result`, wallet
  `get-balance`/`pay`) is attached by default over the `IMarketplaceClient` /
  `IWalletProvider` interfaces (mock implementations until Phase 4).
- **Registry** (`agents`, `listAgents()`, `getMastraAgents()`) with three
  first-party agents:
  - `swap-agent` — quote-first swap execution (`swap-quote`/`swap-execute`
    are clearly-marked mocks until the Uniswap Trading API lands in Phase 4)
  - `research-agent` — structured research (`web-research` stub, stable
    interface)
  - `actle` — the image agent ported faithfully from the original Eliza
    character (`actle.img.prod.json`, secrets stripped); preserves the
    dalle/ideogram/mix/gpt topic-suffix routing and the `$act$` mixed-result
    separator
- **Marketplace constants** — `SUPPORTED_TOPICS` / `TOPIC_TO_ACTION` carried
  over byte-for-byte (topics are bytes32-registered on-chain; never rename),
  `TaskState` (cross-checked against the old compiled contract dist —
  regenerate from the monorepo contracts package), `TaskProcessingStatus`.
- **`createTaskLifecycleWorkflow()`** — the old marketplace task loop as a
  Mastra workflow: fetch prompt from the backend API (the on-chain payload is
  NOT the prompt) -> process by topic -> submit on-chain. Dependency-injected
  and fully testable offline.
- **Lazy MCP client** to `@actflow/mcp` (`getActflowMcpToolsets()`), attached
  per-call: `agent.generate(prompt, { toolsets: await getActflowMcpToolsets() })`.

## Usage

```ts
import { Mastra } from "@mastra/core";
import { getMastraAgents, getActflowMcpToolsets, hasModelProviderKey } from "@actflow/agents";

export const mastra = new Mastra({ agents: getMastraAgents() });

if (hasModelProviderKey()) {
  const actle = mastra.getAgentById("actle");
  const res = await actle.generate("An astronaut riding a dogecoin", {
    toolsets: await getActflowMcpToolsets(),
  });
}
```

## Environment

The package builds and unit-tests with **no** keys; live LLM calls are
guarded with `hasModelProviderKey()`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | for live calls only | Model provider key (Mastra model router, read at call time) |
| `ACTFLOW_AGENT_MODEL` | no | Override default model (`anthropic/claude-opus-4-8`) |
| `ACTFLOW_MCP_URL` | no | Connect to a running @actflow/mcp server over HTTP instead of stdio |
| `ACTFLOW_MCP_COMMAND` / `ACTFLOW_MCP_ARGS` | no | Override the stdio launch (default `npx actflow-mcp`) |

The spawned `@actflow/mcp` server reads its own `API_BASE_URL` /
`ACT_USERNAME` / `ACT_PASSWORD` from the inherited environment.

## Scripts

```bash
pnpm build   # tsc
pnpm test    # tsc && node --test dist/tests/
pnpm lint    # no-op
```
