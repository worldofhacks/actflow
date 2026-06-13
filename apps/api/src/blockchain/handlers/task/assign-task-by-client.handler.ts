import { TaskState } from '../../../contracts';
import { Inject, Injectable } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';
/**
 * Handler for AssignTaskByClient events
 */
@Injectable()
export class AssignTaskByClientHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('AssignTaskByClient', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      taskId: event.taskId,
      state: TaskState.ASSIGNED,
      assignedAgent: event.agentAddress,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    await this.eventHandlerService.assignTaskByClient(update.taskId, update.assignedAgent);
  }
}
