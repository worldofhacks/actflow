import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MarketApiClient } from "../api-client";

/**
 * `hire-agent` — let an EXTERNAL agent discover -> hire an ActFlow agent over
 * MCP. Calls the ActFlow API's single "unlock task" entry point:
 *   POST {API_BASE_URL}/payments/hire
 *
 * The base URL comes from env API_BASE_URL (default http://localhost:3401, the
 * Agent API port). This tool DOES NOT fabricate or sign any payment: it relays
 * exactly what /payments/hire returns, which is one of:
 *
 *   - HTTP 402 -> a 402 x402 PAYMENT CHALLENGE (the hirer must then pay via
 *     POST /payments/settle). This is surfaced as { status: 402, challenge, settle }.
 *   - HTTP 200 -> a WORLD-TRIAL free unlock (a valid worldNullifier with a
 *     remaining free trial unlocked the task WITHOUT payment). Surfaced as
 *     { status: 200, method: 'world-trial', unlocked, receipt, ... }.
 *
 * Both paths are DRY-RUN / MOCK safe: the server settles x402 in a labeled mock
 * mode when no Arc funds / Privy creds are present, and the free-trial receipt
 * is mock:true — so this tool needs no funds/creds to be exercised, and never
 * presents a real on-chain transaction. NO hard-coded addresses, prices, or
 * chain ids: the server resolves recipient/price/chain from its own config
 * (PAYMENTS_ESCROW_ADDRESS / PAYMENTS_DEFAULT_PRICE / chain config).
 *
 * Registered alongside search-agents / search-tasks / resolve-ens-agent,
 * matching their registrar shape exactly. The MarketApiClient is intentionally
 * unused (this tool posts an unauthenticated body to /payments/hire, which
 * reads the user optionally), mirroring resolve-ens-agent's signature.
 */
function apiBaseUrl(): string {
  const raw = process.env.API_BASE_URL?.trim();
  const base = raw && raw.length > 0 ? raw : "http://localhost:3401";
  return base.replace(/\/+$/, "");
}

export function registerHireAgentTool(
  server: McpServer,
  _apiClient: MarketApiClient
): void {
  server.registerTool(
    "hire-agent",
    {
      title: "Hire Agent",
      description:
        "Hire an ActFlow agent over MCP via the marketplace payment flow " +
        "(POST {API_BASE_URL}/payments/hire, default http://localhost:3401). " +
        "Returns either an HTTP 402 x402 payment challenge (pay it via " +
        "/payments/settle) OR, when a valid worldNullifier with a remaining " +
        "free trial is supplied, a 200 world-trial free unlock. Does NOT sign " +
        "or fabricate any payment — it surfaces exactly what the server returns.",
      inputSchema: {
        agentAddress: z
          .string()
          .optional()
          .describe(
            "Agent (payee) address (0x...). Falls back to the server's " +
              "PAYMENTS_ESCROW_ADDRESS when omitted."
          ),
        resource: z
          .string()
          .optional()
          .describe(
            "The task/topic the payment unlocks (the x402 `resource`). " +
              "Defaults to `topic`, else a value derived from agentAddress."
          ),
        topic: z
          .string()
          .optional()
          .describe("Topic of the task (display/categorisation)."),
        price: z
          .string()
          .optional()
          .describe(
            "Price in USDC as a decimal string (e.g. \"0.05\"). Falls back to " +
              "the server's PAYMENTS_DEFAULT_PRICE."
          ),
        worldNullifier: z
          .string()
          .optional()
          .describe(
            "Optional World ID nullifier (proof-of-human). With a remaining " +
              "free trial, unlocks the task for FREE instead of returning a 402."
          ),
      },
    },
    async (params) => {
      try {
        // /payments/hire requires a `resource`. The MCP brief makes it
        // optional, so derive a stable one when omitted: prefer the topic,
        // then a value scoped to the agent being hired.
        const resource =
          params.resource?.trim() ||
          params.topic?.trim() ||
          (params.agentAddress?.trim()
            ? `hire:${params.agentAddress.trim()}`
            : "");

        if (!resource) {
          throw new Error(
            "Provide at least one of `resource`, `topic`, or `agentAddress` so " +
              "the hire request has a resource to unlock."
          );
        }

        const body: Record<string, unknown> = { resource };
        if (params.agentAddress?.trim())
          body.agentAddress = params.agentAddress.trim();
        if (params.topic?.trim()) body.topic = params.topic.trim();
        if (params.price?.trim()) body.price = params.price.trim();
        if (params.worldNullifier?.trim())
          body.worldNullifier = params.worldNullifier.trim();

        const base = apiBaseUrl();
        const response = await fetch(`${base}/payments/hire`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });

        // 402 (payment required) and 200 (world-trial unlock) are BOTH expected,
        // valid outcomes — not errors. Surface the parsed body verbatim with the
        // HTTP status so the caller can branch on `status`.
        const text = await response.text();
        let parsed: any;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = { raw: text };
        }

        if (response.status === 402 || response.status === 200) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { httpStatus: response.status, result: parsed },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Any other status is a real failure from the API (e.g. 400 bad input).
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: `hire failed: HTTP ${response.status}`,
                  httpStatus: response.status,
                  detail: parsed,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      } catch (error: any) {
        console.error("Error hiring agent:", error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error hiring agent: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
