import { Injectable, Logger } from '@nestjs/common';
import { TaskService } from '../task/services/task.service';
import { UnlockTaskHook } from './payments.service';

/**
 * Adapter that ties a successful payment / free-trial into the EXISTING task service.
 *
 * It is deliberately additive and non-fatal: on a successful unlock we look up the task by
 * its on-chain taskId (the `resource`) and return its mongo id for the receipt. We do NOT
 * mutate escrow / on-chain reward state here — that path is owned by the marketplace/task
 * streams (see TaskController's create-task flow). If no task exists yet for the resource
 * (e.g. it is created on-chain after payment), the hook simply returns undefined and the
 * receipt is still written. Removing this adapter restores the prior behaviour exactly.
 */
@Injectable()
export class TaskUnlockService {
  private readonly logger = new Logger(TaskUnlockService.name);

  constructor(private readonly taskService: TaskService) {}

  /** Build the unlock hook PaymentsService calls after a verified payment / trial. */
  hook(): UnlockTaskHook {
    return async (ctx) => {
      try {
        const mongoId = await this.taskService.findIdByTaskId(ctx.resource);
        if (mongoId) {
          this.logger.log(
            `task ${ctx.resource} unlocked via ${ctx.method}${ctx.mock ? ' (mock)' : ''}`,
          );
          return mongoId.toString();
        }
        return undefined;
      } catch (err) {
        this.logger.warn(
          `unlock lookup failed for resource ${ctx.resource}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return undefined;
      }
    };
  }
}
