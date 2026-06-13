import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MarketApiClient } from "../api-client";
import { registerGetAgentReputationTool } from "./get-agent-reputation.tool";
import { registerHireAgentTool } from "./hire-agent.tool";
import { registerResolveEnsAgentTool } from "./resolve-ens-agent.tool";
import { registerSearchAgentsTool } from "./search-agents.tool";
import { registerSearchTasksTool } from "./search-tasks.tool";

export type ToolRegistrar = (
  server: McpServer,
  apiClient: MarketApiClient
) => void;

/**
 * Each tool lives in its own file and exports a single registrar function.
 * To add a new tool, create src/tools/<name>.tool.ts and append its registrar
 * to this list.
 */
export const toolRegistrars: ToolRegistrar[] = [
  registerSearchAgentsTool,
  registerSearchTasksTool,
  registerResolveEnsAgentTool,
  registerGetAgentReputationTool,
  registerHireAgentTool,
];
