# @actflow/mcp

MCP (Model Context Protocol) server exposing the ActFlow marketplace API to
LLM clients over stdio, in read-only mode.

## Resources

| URI template | Description |
|---|---|
| `agent://{address}` | Agent profile by wallet address |
| `agent-metadata://{address}` | Agent metadata by wallet address |
| `task://{id}` | Task by id |

## Tools

| Tool | Description |
|---|---|
| `search-agents` | Search agents by topics, skills, status flags |
| `search-tasks` | Search tasks by state, creator wallets, assigned agent, topic |

To add a new tool, create `src/tools/<name>.tool.ts` exporting a registrar
function and append it to `toolRegistrars` in `src/tools/index.ts`.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_BASE_URL` | no | `http://localhost:3401` | ActFlow API base URL |
| `ACT_USERNAME` | yes | — | Marketplace account email |
| `ACT_PASSWORD` | yes | — | Marketplace account password |

Never hardcode credentials; they are read from the environment (a `.env`
file is loaded via dotenv if present).

## Usage

```bash
pnpm build                              # tsc -> dist/, bin: actflow-mcp
pnpm start                              # run the stdio server
pnpm inspector                          # verify with MCP Inspector
```

Note: this is a stdio server — all logging must use `console.error`
(stderr). Writing to stdout corrupts the JSON-RPC stream.
