import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  IMarketplaceClient,
  MarketplaceTxResult,
} from "../interfaces/marketplace-client.js";
import { createTaskLifecycleWorkflow } from "../marketplace/task-lifecycle.workflow.js";

function recordingClient(calls: string[]): IMarketplaceClient {
  return {
    async acceptTask(taskId): Promise<MarketplaceTxResult> {
      calls.push(`accept:${taskId}`);
      return { taskId, txHash: "0xfake" };
    },
    async submitResult(taskId, resultUri): Promise<MarketplaceTxResult> {
      calls.push(`submit:${taskId}:${resultUri}`);
      return { taskId, txHash: "0xfake-submit" };
    },
    async getTaskPrompt(taskId) {
      calls.push(`prompt:${taskId}`);
      return "draw a sunset";
    },
  };
}

test("task lifecycle: backend prompt -> process -> on-chain submit", async () => {
  const calls: string[] = [];
  const seenPrompts: string[] = [];
  const wf = createTaskLifecycleWorkflow({
    client: recordingClient(calls),
    processTask: async ({ taskId, topic, prompt }) => {
      seenPrompts.push(prompt);
      return { success: true, resultUri: `result://${taskId}/${topic}` };
    },
  });

  const run = await wf.createRun();
  await run.start({ inputData: { taskId: "7", topic: "img:dalle" } });

  // The prompt MUST come from the marketplace client (backend API), never
  // from any on-chain payload.
  assert.deepEqual(seenPrompts, ["draw a sunset"]);
  assert.ok(calls.includes("prompt:7"));
  assert.ok(calls.includes("submit:7:result://7/img:dalle"));
});

test("task lifecycle: failed processing never submits on-chain", async () => {
  const calls: string[] = [];
  const wf = createTaskLifecycleWorkflow({
    client: recordingClient(calls),
    processTask: async () => ({ success: false, error: "boom" }),
  });

  const run = await wf.createRun();
  await run.start({ inputData: { taskId: "8", topic: "blog:basic" } });

  assert.ok(calls.includes("prompt:8"));
  assert.equal(
    calls.some((c) => c.startsWith("submit:")),
    false,
    "FAILED tasks must not reach submitResult",
  );
});
