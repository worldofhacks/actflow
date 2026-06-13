import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MarketApiClient } from "../api-client";

/**
 * `get-agent-reputation` — fetch an agent's reputation score from the
 * @actflow/reputation ranking service.
 *
 * Calls the reputation service's ranking API:
 *   GET {REPUTATION_URL}/agents/:address/reputation
 *
 * The base URL comes from env REPUTATION_URL (default http://localhost:3402,
 * the reputation service's default port). NO hard-coded addresses, chain ids,
 * or registry addresses here — the reputation service owns all ERC-8004 /
 * BigQuery config (which itself sources registry addresses from the
 * erc8004-bigquery skill). This tool only relays what that service returns.
 *
 * The reputation service is OPTIONAL infrastructure: when it is not running we
 * MUST NOT fail hard, so an unreachable service yields a structured
 * { available: false, reason } result instead of an error. The service runs in
 * fixture mode with no GCP creds, so this path is fully usable with no
 * credentials/funds (DRY-RUN safe). When the service is reachable, the returned
 * payload carries `source: 'live' | 'fixture'` so callers know which it is.
 *
 * Registered alongside search-agents / search-tasks / resolve-ens-agent,
 * matching their registrar shape exactly. The MarketApiClient is unused here
 * (this tool talks to a DIFFERENT base URL, the reputation service), mirroring
 * resolve-ens-agent which also ignores the injected client.
 */
function reputationBaseUrl(): string {
  const raw = process.env.REPUTATION_URL?.trim();
  const base = raw && raw.length > 0 ? raw : "http://localhost:3402";
  // Strip a trailing slash so path joins are clean.
  return base.replace(/\/+$/, "");
}

export function registerGetAgentReputationTool(
  server: McpServer,
  _apiClient: MarketApiClient
): void {
  server.registerTool(
    "get-agent-reputation",
    {
      title: "Get Agent Reputation",
      description:
        "Fetch an agent's ERC-8004 reputation from the ActFlow reputation " +
        "ranking service (REPUTATION_URL, default http://localhost:3402). " +
        "Returns the RankedAgent (score, breakdown, x402 flag, validations, " +
        "and source: live|fixture). If the reputation service is unreachable " +
        "it returns { available: false, reason } rather than failing.",
      inputSchema: {
        address: z
          .string()
          .describe("Agent wallet address (0x...) to look up reputation for"),
      },
    },
    async (params) => {
      const address = params.address?.trim();
      if (!address) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error getting agent reputation: address must be a non-empty string",
            },
          ],
          isError: true,
        };
      }

      const base = reputationBaseUrl();
      const url = `${base}/agents/${encodeURIComponent(address)}/reputation`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (error: any) {
        // Service-unreachable: degrade gracefully, do NOT throw. The reputation
        // service is optional; a down service must not break MCP discovery.
        console.error(`Reputation service unreachable at ${base}:`, error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  available: false,
                  reason: `reputation service unreachable at ${base}: ${
                    error?.message ?? String(error)
                  }`,
                  address,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // 404 => the agent is simply not in the registry data; surface that as a
      // normal (non-error) result so callers can branch on it.
      if (response.status === 404) {
        let body: any = null;
        try {
          body = await response.json();
        } catch {
          /* ignore non-JSON body */
        }
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  available: true,
                  found: false,
                  address,
                  source: body?.source,
                  reason: body?.error ?? "agent not found",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  available: false,
                  reason: `reputation service returned HTTP ${response.status}`,
                  detail: text,
                  address,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const data: any = await response.json();
      // The service responds { source, agent: RankedAgent }. Return the
      // RankedAgent (carrying score, breakdown, x402, validations, source).
      const agent = data?.agent ?? data;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                available: true,
                found: true,
                source: data?.source ?? agent?.source,
                agent,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
