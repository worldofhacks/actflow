import { MCPClient } from "@mastra/mcp";

/**
 * Lazily-connected MCP client for the @actflow/mcp server.
 *
 * Config-driven via env:
 *   ACTFLOW_MCP_URL     — connect over HTTP/SSE to a running server, OR
 *   ACTFLOW_MCP_COMMAND — stdio command (default "npx")
 *   ACTFLOW_MCP_ARGS    — stdio args, space-separated (default "actflow-mcp",
 *                         the bin shipped by the @actflow/mcp workspace dep)
 *
 * The @actflow/mcp server itself reads API_BASE_URL / ACT_USERNAME /
 * ACT_PASSWORD from the inherited environment.
 *
 * The client is a module-scope singleton (constructed on first use, never at
 * import time) — multiple identically-configured MCPClient instances without
 * distinct ids throw to prevent memory leaks. Nothing connects until tools
 * are actually listed.
 */

let client: MCPClient | undefined;

function buildServerDefinition() {
  const url = process.env.ACTFLOW_MCP_URL;
  if (url) {
    return { url: new URL(url) };
  }
  const command = process.env.ACTFLOW_MCP_COMMAND ?? "npx";
  const args = process.env.ACTFLOW_MCP_ARGS
    ? process.env.ACTFLOW_MCP_ARGS.split(" ").filter(Boolean)
    : ["actflow-mcp"];
  return { command, args };
}

/** Get (lazily creating) the shared MCPClient for the ActFlow MCP server. */
export function getActflowMcpClient(): MCPClient {
  if (!client) {
    client = new MCPClient({
      id: "actflow-agents-mcp",
      servers: {
        actflow: buildServerDefinition(),
      },
    });
  }
  return client;
}

/**
 * Dynamic per-request toolsets for `agent.generate(prompt, { toolsets })`.
 * Connects on first call. Tool keys are namespaced "actflow.<toolName>".
 */
export async function getActflowMcpToolsets() {
  return getActflowMcpClient().listToolsets();
}

/**
 * Static tool map for fixing MCP tools at agent definition time
 * (tool names namespaced "actflow_<toolName>"). Connects on call.
 */
export async function getActflowMcpTools() {
  return getActflowMcpClient().listTools();
}

/** Disconnect and drop the singleton (tests / graceful shutdown). */
export async function disconnectActflowMcp(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = undefined;
  }
}
