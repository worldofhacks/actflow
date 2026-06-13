import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class StakeValidatorHandler extends BaseEventHandler {
  constructor(
    private readonly eventHandlerService: EventHandlerService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('StakeValidator', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      validatorAddress: event.eventData['agent'] || event.eventData[0] || '',
      expireAtTs: event.eventData['expireAtTs'] || event.eventData[1] || 0,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.eventHandlerService.processValidatorRegistration(
      update.validatorAddress,
      update.expireAtTs,
      event,
    );
  }
}
