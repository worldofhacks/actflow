import { TaskState } from '../../../contracts';
import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class ValidateTaskHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('ValidateTask', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      taskId: event.taskId,
      state: TaskState.VALIDATED,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    await this.eventHandlerService.validateTask(update.taskId, isHistorical);
  }
}
