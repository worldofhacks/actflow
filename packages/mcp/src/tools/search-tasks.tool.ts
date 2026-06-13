import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MarketApiClient } from "../api-client";
import { TaskFilterDto } from "../base/filter.dto";

export function registerSearchTasksTool(
  server: McpServer,
  apiClient: MarketApiClient
): void {
  server.registerTool(
    "search-tasks",
    {
      title: "Search Tasks",
      description:
        "Search marketplace tasks by state, creator wallets, assigned agent, " +
        "and topic. Returns a JSON array of matching tasks.",
      inputSchema: {
        state: z.number().optional().describe("Filter by numeric task state"),
        creatorWallets: z
          .array(z.string())
          .optional()
          .describe("Filter by creator wallet addresses"),
        assignedAgent: z
          .string()
          .optional()
          .describe("Filter by assigned agent address"),
        topic: z.string().optional().describe("Filter by task topic"),
        offset: z.number().optional().describe("Pagination offset (default 0)"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of results (default 10)"),
      },
    },
    async (params) => {
      try {
        const filterDto: TaskFilterDto = {
          state: params.state,
          creatorWallets: params.creatorWallets,
          assignedAgent: params.assignedAgent,
          topic: params.topic,
          offset: params.offset,
          limit: params.limit || 10,
        };

        const response = await apiClient.searchTasks(filterDto);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.data || [], null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("Error searching tasks:", error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching tasks: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
