import { TaskState } from '../../../contracts';
import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class ResolveTaskHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('ResolveTask', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      taskId: event.taskId,
      clientAmount: event.eventData['clientAmount'] || event.eventData[1] || 0,
      agentAmount: event.eventData['agentAmount'] || event.eventData[2] || 0,
      validatorAmount: event.eventData['validatorAmount'] || event.eventData[3] || 0,
      state: TaskState.RESOLVED,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    await this.eventHandlerService.resolveTask(
      update.taskId,
      update.clientAmount,
      update.agentAmount,
      update.validatorAmount,
      isHistorical,
    );
  }
}
