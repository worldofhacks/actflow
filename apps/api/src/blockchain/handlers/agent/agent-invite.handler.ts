import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class AgentInviteHandler extends BaseEventHandler {
  constructor(
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
    @Inject(EventHandlerService) private readonly handlerService: EventHandlerService,
  ) {
    super('AgentInvite', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      agentAddress: event.agentAddress,
      taskId: event.taskId,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.handlerService.addInvite(update.taskId, update.agentAddress);
  }
}
