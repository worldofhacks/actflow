import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type IMarketplaceClient,
  MockMarketplaceClient,
} from "../interfaces/marketplace-client.js";

/**
 * Standard marketplace tools (acceptTask / submitResult).
 *
 * Typed stubs over IMarketplaceClient — the default client is the
 * clearly-marked MockMarketplaceClient until Phase 4 wires the live
 * backend + ethers v6 contract client. Tool ids/schemas are the stable
 * interface; only the injected client changes later.
 */
export function createMarketplaceTools(
  client: IMarketplaceClient = new MockMarketplaceClient(),
) {
  const acceptTask = createTool({
    id: "accept-task",
    description:
      "Accept an assigned ActFlow marketplace task by id. Call this before doing any work on a task.",
    inputSchema: z.object({
      taskId: z.string().min(1).describe("Marketplace task id"),
    }),
    outputSchema: z.object({
      taskId: z.string(),
      txHash: z.string(),
      mock: z.boolean().optional(),
    }),
    execute: async ({ taskId }) => {
      return client.acceptTask(taskId);
    },
  });

  const submitResult = createTool({
    id: "submit-result",
    description:
      "Submit the finished result (a URI or content string) for a marketplace task on-chain. Call this exactly once when the work is complete.",
    inputSchema: z.object({
      taskId: z.string().min(1).describe("Marketplace task id"),
      resultUri: z
        .string()
        .min(1)
        .describe("URI (or content string) of the completed work"),
    }),
    outputSchema: z.object({
      taskId: z.string(),
      txHash: z.string(),
      mock: z.boolean().optional(),
    }),
    execute: async ({ taskId, resultUri }) => {
      return client.submitResult(taskId, resultUri);
    },
  });

  return { acceptTask, submitResult };
}
