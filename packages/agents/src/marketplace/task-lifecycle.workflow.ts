import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { hasModelProviderKey } from "../config/model.js";
import {
  type IMarketplaceClient,
  MockMarketplaceClient,
} from "../interfaces/marketplace-client.js";
import { TaskProcessingStatus } from "./task-state.js";
import {
  SUPPORTED_TOPICS,
  TOPIC_TO_ACTION,
  type SupportedTopic,
} from "./topics.js";

/**
 * Task-lifecycle workflow — the old Eliza marketplace task loop re-implemented
 * as a Mastra workflow (design ported, code NOT copied):
 *
 *   AssignTask event (Phase 4 chain listener, block-range polling with a
 *   single ICheckpointStore checkpoint)
 *     -> fetch-task-prompt   real prompt comes from the BACKEND API
 *                            (getTaskById(taskId).data.metadata.prompt) —
 *                            the on-chain payload is NOT the prompt
 *     -> process-task        route by topic (TOPIC_TO_ACTION / registry) and
 *                            run the agent; status PROCESSING -> FAILED or
 *                            READY_FOR_SUBMISSION
 *     -> submit-result       on-chain submitTask(taskId, resultUri);
 *                            status SUBMITTING -> SUBMITTED
 *
 * Retry/heartbeat jobs from the old runtime are intentionally out of scope
 * here — they become schedulers around `run.start()` in Phase 4.
 *
 * Dependencies are injected so the workflow is fully testable offline; the
 * defaults are clearly-marked mocks.
 */

const topicSchema = z.enum(SUPPORTED_TOPICS);

export interface ProcessTaskInput {
  taskId: string;
  topic: SupportedTopic;
  prompt: string;
}

export interface ProcessTaskResult {
  success: boolean;
  resultUri?: string;
  error?: string;
}

export type ProcessTaskFn = (
  input: ProcessTaskInput,
) => Promise<ProcessTaskResult>;

export interface TaskLifecycleDeps {
  client?: IMarketplaceClient;
  processTask?: ProcessTaskFn;
}

/**
 * Default processor — guarded mock. Returns a clearly-marked mock result and
 * NEVER makes a live LLM call without a provider key. Phase 4 swaps this for
 * an agent-backed processor (registry.getAgentForTopic + agent.generate).
 */
export const mockProcessTask: ProcessTaskFn = async ({ taskId, topic }) => {
  if (!hasModelProviderKey()) {
    return {
      success: true,
      resultUri: `mock://result/${taskId}?topic=${encodeURIComponent(topic)}&action=${TOPIC_TO_ACTION[topic]}`,
    };
  }
  // A key is present, but this default processor is still a mock — live
  // agent-backed processing is wired in Phase 4 via the `processTask` dep.
  return {
    success: true,
    resultUri: `mock://result/${taskId}?topic=${encodeURIComponent(topic)}&action=${TOPIC_TO_ACTION[topic]}`,
  };
};

export function createTaskLifecycleWorkflow(deps: TaskLifecycleDeps = {}) {
  const client = deps.client ?? new MockMarketplaceClient();
  const processTask = deps.processTask ?? mockProcessTask;

  const fetchTaskPrompt = createStep({
    id: "fetch-task-prompt",
    inputSchema: z.object({
      taskId: z.string().min(1),
      topic: topicSchema,
    }),
    outputSchema: z.object({
      taskId: z.string(),
      topic: topicSchema,
      prompt: z.string(),
    }),
    execute: async ({ inputData }) => {
      // Backend API is authoritative for the prompt — never the chain payload.
      const prompt = await client.getTaskPrompt(inputData.taskId);
      return { taskId: inputData.taskId, topic: inputData.topic, prompt };
    },
  });

  const processTaskStep = createStep({
    id: "process-task",
    inputSchema: z.object({
      taskId: z.string(),
      topic: topicSchema,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      taskId: z.string(),
      status: z.enum([
        TaskProcessingStatus.READY_FOR_SUBMISSION,
        TaskProcessingStatus.FAILED,
      ]),
      resultUri: z.string().optional(),
      error: z.string().optional(),
    }),
    execute: async ({ inputData }) => {
      // Status machine: PROCESSING -> READY_FOR_SUBMISSION | FAILED
      try {
        const result = await processTask(inputData);
        if (!result.success || !result.resultUri) {
          return {
            taskId: inputData.taskId,
            status: TaskProcessingStatus.FAILED,
            error: result.error ?? "Processing failed",
          };
        }
        return {
          taskId: inputData.taskId,
          status: TaskProcessingStatus.READY_FOR_SUBMISSION,
          resultUri: result.resultUri,
        };
      } catch (error) {
        return {
          taskId: inputData.taskId,
          status: TaskProcessingStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  const submitResultStep = createStep({
    id: "submit-result",
    inputSchema: z.object({
      taskId: z.string(),
      status: z.enum([
        TaskProcessingStatus.READY_FOR_SUBMISSION,
        TaskProcessingStatus.FAILED,
      ]),
      resultUri: z.string().optional(),
      error: z.string().optional(),
    }),
    outputSchema: z.object({
      taskId: z.string(),
      status: z.enum([
        TaskProcessingStatus.SUBMITTED,
        TaskProcessingStatus.FAILED,
      ]),
      txHash: z.string().optional(),
      error: z.string().optional(),
    }),
    execute: async ({ inputData }) => {
      if (
        inputData.status !== TaskProcessingStatus.READY_FOR_SUBMISSION ||
        !inputData.resultUri
      ) {
        return {
          taskId: inputData.taskId,
          status: TaskProcessingStatus.FAILED,
          error: inputData.error ?? "Nothing to submit",
        };
      }
      // Status machine: SUBMITTING -> SUBMITTED | FAILED. The live client
      // additionally verifies the on-chain task is still ASSIGNED before
      // sending the transaction (see old task-submission.job.ts).
      try {
        const tx = await client.submitResult(
          inputData.taskId,
          inputData.resultUri,
        );
        return {
          taskId: inputData.taskId,
          status: TaskProcessingStatus.SUBMITTED,
          txHash: tx.txHash,
        };
      } catch (error) {
        return {
          taskId: inputData.taskId,
          status: TaskProcessingStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  return createWorkflow({
    id: "task-lifecycle",
    inputSchema: z.object({
      taskId: z.string().min(1),
      topic: topicSchema,
    }),
    outputSchema: z.object({
      taskId: z.string(),
      status: z.enum([
        TaskProcessingStatus.SUBMITTED,
        TaskProcessingStatus.FAILED,
      ]),
      txHash: z.string().optional(),
      error: z.string().optional(),
    }),
  })
    .then(fetchTaskPrompt)
    .then(processTaskStep)
    .then(submitResultStep)
    .commit();
}

/** Default instance backed by the mock client/processor. */
export const taskLifecycleWorkflow = createTaskLifecycleWorkflow();
