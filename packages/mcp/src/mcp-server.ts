import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MarketApiClient } from "./api-client";
import { TokenManager } from "./base/token.manager";
import { toolRegistrars } from "./tools";

/**
 * MCP server for the ActFlow Marketplace API.
 * Exposes the marketplace to LLM clients in read-only mode over stdio.
 *
 * IMPORTANT: this is a stdio transport server. Never write diagnostics to
 * stdout (console.log) — it corrupts the JSON-RPC framing. All logging in
 * this package must go to stderr via console.error.
 */
export class MarketplaceMcpServer {
  private server: McpServer;
  private apiClient: MarketApiClient;
  private apiUrl: string;
  private login: string;
  private password: string;

  constructor() {
    this.apiUrl = process.env.API_BASE_URL || "http://localhost:3401";
    this.login = process.env.ACT_USERNAME || "";
    this.password = process.env.ACT_PASSWORD || "";

    if (!this.apiUrl || !this.login || !this.password) {
      throw new Error(
        "Missing required environment variables: API_BASE_URL, ACT_USERNAME, ACT_PASSWORD"
      );
    }

    const tokenManager = new TokenManager(async () => {
      try {
        console.error(
          `Logging in to ACT API. URL: ${this.apiUrl}, User: ${this.login}`
        );

        const requestBody = JSON.stringify({
          email: this.login,
          password: this.password,
        });

        const response = await fetch(`${this.apiUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Node.js)",
          },
          body: requestBody,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Cannot login to ACT API. URL: ${this.apiUrl} Status: ${response.status} Error: ${errorText}`
          );
          throw new Error(
            `Cannot login to ACT API: ${response.status} - ${errorText}`
          );
        }

        const data: any = await response.json();
        console.error("ACT API login successful");
        return data.data.access_token;
      } catch (error: any) {
        console.error(`Exception during login to ACT API: ${error.message}`);
        throw error;
      }
    }, 60);

    this.apiClient = new MarketApiClient(this.apiUrl, tokenManager);

    this.server = new McpServer({
      name: "ACT Marketplace API",
      version: "1.0.0",
    });

    this.registerResources();
    this.registerTools();
  }

  private registerResources() {
    this.server.registerResource(
      "agent",
      new ResourceTemplate("agent://{address}", { list: undefined }),
      {
        title: "Agent",
        description: "Marketplace agent profile, looked up by wallet address",
        mimeType: "application/json",
      },
      async (uri, { address }) => {
        if (Array.isArray(address)) {
          throw new Error("Address must be a single string");
        }
        const response = await this.apiClient.getAgent(address);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(response.data || {}, null, 2),
            },
          ],
        };
      }
    );

    this.server.registerResource(
      "agent-metadata",
      new ResourceTemplate("agent-metadata://{address}", { list: undefined }),
      {
        title: "Agent Metadata",
        description: "Marketplace agent metadata, looked up by wallet address",
        mimeType: "application/json",
      },
      async (uri, { address }) => {
        if (Array.isArray(address)) {
          throw new Error("Address must be a single string");
        }
        const response = await this.apiClient.getAgentMetadata(address);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(response.data || {}, null, 2),
            },
          ],
        };
      }
    );

    this.server.registerResource(
      "task",
      new ResourceTemplate("task://{id}", { list: undefined }),
      {
        title: "Task",
        description: "Marketplace task, looked up by task id",
        mimeType: "application/json",
      },
      async (uri, { id }) => {
        if (Array.isArray(id)) {
          throw new Error("Task ID must be a single string");
        }
        const response = await this.apiClient.getTaskById(id);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(response.data || {}, null, 2),
            },
          ],
        };
      }
    );
  }

  private registerTools() {
    for (const register of toolRegistrars) {
      register(this.server, this.apiClient);
    }
  }

  async start() {
    try {
      console.error("Starting ACT Marketplace MCP Server...");
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error("ACT Marketplace MCP Server ready");
    } catch (error) {
      console.error("Failed to start MCP server:", error);
      process.exit(1);
    }
  }
}
