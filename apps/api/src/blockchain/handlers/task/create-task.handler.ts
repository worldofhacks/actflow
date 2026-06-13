import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { createTransactionInfoEvent } from '../../utils';
import { BaseEventHandler } from '../base/base-event.handler';

export class CreateTaskHandler extends BaseEventHandler {
  constructor(
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
    @Inject(EventHandlerService) private readonly eventHandlerService: EventHandlerService,
  ) {
    super('CreateTask', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      taskId: event.taskId,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.eventHandlerService.processTaskCreation(
      update.taskId,
      update.creator,
      createTransactionInfoEvent(event),
    );
  }
}
