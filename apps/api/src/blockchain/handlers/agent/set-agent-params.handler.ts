import { Inject } from '@nestjs/common';
import { AgentService } from '../../../agents/services/agent.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

/**
 * Handler for SetAgentMetadata events
 */
export class SetAgentParamsHandler extends BaseEventHandler {
  constructor(
    @Inject(AgentService) private readonly agentService: AgentService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('SetAgentParams', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      agentAddress: event.agentAddress,
      autoAssign: event.eventData['autoAssign'] || event.eventData[1] || false,
      fee: event.eventData['fee'] || event.eventData[2] || 0,
      executionDuration: event.eventData['executionDuration'] || event.eventData[3] || 0,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.agentService.updateAgentParams(update.agentAddress, {
      fee: update.fee,
      autoAssign: update.autoAssign,
      executionDuration: update.executionDuration,
    });
  }
}
