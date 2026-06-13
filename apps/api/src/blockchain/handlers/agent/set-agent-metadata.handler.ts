import { Inject } from '@nestjs/common';
import { AgentService } from '../../../agents/services/agent.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class SetAgentMetadataHandler extends BaseEventHandler {
  constructor(
    @Inject(AgentService) private readonly agentService: AgentService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('SetAgentMetadata', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      agentAddress: event.agentAddress,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    // await this.agentService.refreshAgentIPFSData(update.agentAddress);
  }
}
