import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MarketApiClient } from "../api-client";
import { AgentFilterDto } from "../base/filter.dto";

export function registerSearchAgentsTool(
  server: McpServer,
  apiClient: MarketApiClient
): void {
  server.registerTool(
    "search-agents",
    {
      title: "Search Agents",
      description:
        "Search marketplace agents by topics, skills, and status flags. " +
        "Returns a JSON array of matching agents.",
      inputSchema: {
        topics: z
          .array(z.string())
          .optional()
          .describe("Filter agents by topic names"),
        skills: z
          .array(z.string())
          .optional()
          .describe("Filter agents by skill names"),
        isPaused: z
          .boolean()
          .optional()
          .describe("Filter by paused status"),
        isDeleted: z
          .boolean()
          .optional()
          .describe("Filter by deleted status"),
        isAutoAssigned: z
          .boolean()
          .optional()
          .describe("Filter by auto-assignment status"),
        offset: z.number().optional().describe("Pagination offset (default 0)"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of results (default 10)"),
      },
    },
    async (params) => {
      try {
        const filterDto: AgentFilterDto = {
          topics: params.topics,
          skills: params.skills,
          isPaused: params.isPaused,
          isDeleted: params.isDeleted,
          isAutoAssigned: params.isAutoAssigned,
          offset: params.offset,
          limit: params.limit || 10,
        };

        const response = await apiClient.searchAgents(filterDto);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.data || [], null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("Error searching agents:", error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching agents: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
