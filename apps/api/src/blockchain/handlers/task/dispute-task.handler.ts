import { TaskState } from '../../../contracts';
import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class DisputeTaskHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('DisputeTask', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    const isOwnerDispute = event.sender === event.taskOwner;

    return {
      taskId: event.taskId,
      reason: event.eventData['reason'] || event.eventData[1] || '',
      state: isOwnerDispute ? TaskState.DISPUTED_BY_OWNER : TaskState.DISPUTED_BY_AGENT,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    await this.eventHandlerService.disputeTask(
      update.taskId,
      update.reason,
      update.state,
      isHistorical,
    );
  }
}
