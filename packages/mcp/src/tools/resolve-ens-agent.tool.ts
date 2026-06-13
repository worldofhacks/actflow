import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MarketApiClient } from "../api-client";

// @actflow/integrations-ens is ESM-only (its package "exports" defines only the
// `import` condition). This MCP package emits CommonJS, so a STATIC import would
// compile to require() and fail to resolve at runtime. We therefore load it via
// a dynamic import() (preserved as a real ESM import under module:nodenext),
// which resolves the package's `import` condition. Imported lazily on first use.
type EnsModule = typeof import("@actflow/integrations-ens");
let ensModulePromise: Promise<EnsModule> | undefined;
function loadEnsModule(): Promise<EnsModule> {
  ensModulePromise ??= import("@actflow/integrations-ens");
  return ensModulePromise;
}

/**
 * `resolve-ens-agent` — resolve an agent's ENS identity to its AgentProfile.
 *
 * Input is a single `query` that is EITHER an ENS name (a subname under the
 * configured parent, resolved via integrations-ens) OR a `0x` wallet address:
 *  - name    → resolveAgent(name)               → AgentProfile
 *  - address → reverseResolve(address) → name   → resolveAgent(name)
 *
 * All chain/RPC config comes from @actflow/integrations-ens (ENS_CHAIN,
 * MAINNET_RPC_URL / SEPOLIA_RPC_URL, address overrides). NO hard-coded ENS
 * names, addresses, or chain IDs here. Registered alongside search-agents /
 * search-tasks, matching their registrar shape exactly.
 */
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function registerResolveEnsAgentTool(
  server: McpServer,
  _apiClient: MarketApiClient
): void {
  server.registerTool(
    "resolve-ens-agent",
    {
      title: "Resolve ENS Agent",
      description:
        "Resolve an agent's ENS identity to its profile. Accepts an ENS name " +
        "(e.g. <agent>.<parent> under the configured parent name) or a 0x " +
        "wallet address. Returns the resolved name, namehash node, address, and " +
        "decoded agent profile (ENSIP-25/26 records) as JSON.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "ENS name (a subname under the configured parent) or 0x wallet address"
          ),
      },
    },
    async (params) => {
      try {
        const query = params.query.trim();
        if (!query) {
          throw new Error("query must be a non-empty ENS name or 0x address");
        }

        const { resolveAgent, reverseResolve, loadEnsConfig } =
          await loadEnsModule();
        const config = loadEnsConfig();

        if (ADDRESS_RE.test(query)) {
          // Address path: reverse-resolve to a primary name (verified against a
          // forward lookup per the ENS anti-spoofing requirement), then resolve.
          const reverse = await reverseResolve(
            query as `0x${string}`,
            config
          );
          if (!reverse.name) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(
                    { query, name: null, verified: false, profile: null },
                    null,
                    2
                  ),
                },
              ],
            };
          }
          const resolved = await resolveAgent(reverse.name, config);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { query, verified: reverse.verified, ...resolved },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Name path: forward-resolve the agent name to addr + agent records.
        const resolved = await resolveAgent(query, config);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ query, ...resolved }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("Error resolving ENS agent:", error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error resolving ENS agent: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
