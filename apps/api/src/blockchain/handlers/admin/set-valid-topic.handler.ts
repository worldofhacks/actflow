import { Inject } from '@nestjs/common';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';
import { AdminService } from './AdminService';

//TODO: We dont use validated topics now
export class SetValidTopicHandler extends BaseEventHandler {
  constructor(
    private readonly adminService: AdminService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    // Assuming you have an admin service
    super('SetValidTopic', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      topic: event.eventData['topic'] || event.eventData[0] || '',
      state: event.eventData['state'] || event.eventData[1] || false,
    };
  }

  protected async updateEntityState(
    event: BlockchainEventDocument,
    update: any,
    isHistorical: boolean,
  ): Promise<void> {
    // await this.adminService.updateValidTopic(update.topic, update.state);
  }
}
