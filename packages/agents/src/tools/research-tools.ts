import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Research tools — CLEARLY-MARKED MOCK.
 *
 * `webResearch` is a stub with a clean, stable interface; it performs no
 * network calls. A later phase swaps the execute body for a real search
 * backend (or the @actflow/mcp search tools) without changing the schema.
 */

export const webResearch = createTool({
  id: "web-research",
  description:
    "Research a topic on the web and return a list of findings with sources.",
  inputSchema: z.object({
    query: z.string().min(1).describe("What to research"),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe("Maximum number of findings to return"),
  }),
  outputSchema: z.object({
    query: z.string(),
    findings: z.array(
      z.object({
        title: z.string(),
        summary: z.string(),
        url: z.string(),
      }),
    ),
    mock: z.boolean(),
  }),
  execute: async ({ query, maxResults }) => {
    // MOCK: no live web access wired yet.
    return {
      query,
      findings: Array.from({ length: Math.min(maxResults, 3) }, (_, i) => ({
        title: `[MOCK] Finding ${i + 1} for "${query}"`,
        summary:
          "Placeholder result — web research backend is not wired yet in this phase.",
        url: "https://example.com/mock",
      })),
      mock: true,
    };
  },
});

export function createResearchTools() {
  return { webResearch };
}
