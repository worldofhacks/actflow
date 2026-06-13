import { Injectable, Logger } from '@nestjs/common';
import { TaskService } from '../task/services/task.service';
import { UnlockTaskHook } from './payments.service';

/**
 * Adapter that ties a verified payment / consumed World free-trial into the EXISTING task
 * service — GAP 4: the BINDING unlock.
 *
 * On a successful payment (or trial) we look up the task by its on-chain taskId (the
 * `resource`) and ACTUALLY mark it unlocked/funded (TaskService.unlockTask) so a paid /
 * trial-unlocked task proceeds and an unpaid one does not. The receipt id is tied back onto
 * the task via `attachReceipt`. On-chain escrow remains optional (mocked when no chain/funds),
 * but the marketplace-side DECISION is real and reflected on the task record.
 *
 * It is non-fatal: if no task exists yet for the resource (e.g. it is created on-chain after
 * payment), the hook reports unlocked:false and the receipt is still written. The unlock is
 * idempotent (re-running just re-stamps the unlock fields).
 */
@Injectable()
export class TaskUnlockService {
  private readonly logger = new Logger(TaskUnlockService.name);

  constructor(private readonly taskService: TaskService) {}

  /** Build the unlock hook PaymentsService calls after a verified payment / trial. */
  hook(): UnlockTaskHook {
    return async ctx => {
      try {
        const mongoId = await this.taskService.unlockTask(ctx.resource, {
          method: ctx.method,
          mock: ctx.mock,
        });
        if (!mongoId) {
          // No task exists yet for this resource — receipt is still written, but nothing
          // was bound. (Not unlocked.)
          return { unlocked: false };
        }
        return {
          taskId: mongoId.toString(),
          unlocked: true,
          // Tie the just-written receipt back onto the unlocked task for audit.
          attachReceipt: receiptId =>
            this.taskService.attachUnlockReceipt(mongoId, receiptId),
        };
      } catch (err) {
        this.logger.warn(
          `unlock failed for resource ${ctx.resource}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return { unlocked: false };
      }
    };
  }
}
