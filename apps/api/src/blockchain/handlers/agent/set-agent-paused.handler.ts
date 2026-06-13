import { Inject } from '@nestjs/common';
import { AgentService } from '../../../agents/services/agent.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

export class SetAgentPausedHandler extends BaseEventHandler {
  constructor(
    @Inject(AgentService) private readonly agentService: AgentService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('SetAgentPaused', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      agentAddress: event.agentAddress,
      state: event.eventData['state'] || event.eventData[1] || false,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    await this.agentService.updateAgentPauseState(update.agentAddress, update.state);
  }
}
