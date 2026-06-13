import { TaskState } from '../../../contracts';
import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class DeclineTaskHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('DeclineTask', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    const isOwnerDecline = event.sender === event.taskOwner;

    return {
      taskId: event.eventData['taskId'] || event.eventData[0] || '',
      declinedBy: isOwnerDecline ? 'owner' : 'validator',
      state: isOwnerDecline ? TaskState.DECLINED_BY_OWNER : TaskState.DECLINED_BY_VALIDATOR,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    await this.eventHandlerService.declineTask(
      update.taskId,
      update?.reason ?? 'Default reason',
      update.declinedBy,
      isHistorical,
    );
  }
}
