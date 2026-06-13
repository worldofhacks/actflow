import { TaskState } from '../../../contracts';
import { Inject, Injectable } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';
/**
 * Handler for SubmitTask events
 */
@Injectable()
export class SubmitTaskHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('SubmitTask', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      taskId: event.taskId,
      state: TaskState.SUBMITTED,
      result: event.eventData['result'] || event.eventData[1] || '',
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.eventHandlerService.submitTask(
      update.taskId,
      update.result,
      update.creator,
      update.assignedAgentId,
    );
  }
}
