import { Inject } from '@nestjs/common';
import { decodeBytes32String } from 'ethers';
import { AgentService } from '../../../agents/services/agent.service';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockTrackerService } from '../../services/blockchain/block-tracker.service';
import { BaseEventHandler } from '../base/base-event.handler';

/**
 * Handler for SetAgentTopic events
 */
export class SetAgentTopicHandler extends BaseEventHandler {
  constructor(
    @Inject(AgentService) private readonly agentService: AgentService,
    @Inject(BlockTrackerService) blockTracker: BlockTrackerService,
  ) {
    super('SetAgentTopic', blockTracker);
  }

  protected createEntityUpdate(event: BlockchainEventDocument) {
    return {
      agent: event.agentAddress,
      topic: event.eventData['topic'] || event.eventData[1] || '',
      state: event.eventData['state'] || event.eventData[2] || false,
    };
  }

  protected async updateEntityState(event: BlockchainEventDocument, update: any): Promise<void> {
    const decodedTopic = decodeBytes32String(update.topic);
    // await this.agentService.updateAgentTopics(update.agent, decodedTopic, update.state);
  }
}
