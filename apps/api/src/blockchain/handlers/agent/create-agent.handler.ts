import { Inject } from '@nestjs/common';
import { EventHandlerService } from '../../../domain/common/handler.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

/**
 * Handler for RegisterAgent events
 */
export class RegisterAgentHandler extends BaseEventHandler {
  constructor(
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
    @Inject(EventHandlerService) private readonly eventHandlerService: EventHandlerService,
  ) {
    super('RegisterAgent', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      agentAddress: event.agentAddress,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    return this.eventHandlerService.processAgentRegistration(update.agentAddress, event);
  }
}
