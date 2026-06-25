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
    // Topics are bytes32 on-chain. Conventionally they are bytes32-encoded
    // strings (decodable), but an agent may register a keccak-hashed topic —
    // decodeBytes32String then throws "invalid bytes32 string". The decoded
    // value is currently unused (the topic-state update is disabled), so a
    // non-string topic must NEVER crash event processing for the whole batch.
    let decodedTopic: string | null = null;
    try {
      decodedTopic = decodeBytes32String(update.topic);
    } catch {
      decodedTopic = update.topic; // keep the raw bytes32 when it isn't a packed string
    }
    void decodedTopic;
    // await this.agentService.updateAgentTopics(update.agent, decodedTopic, update.state);
  }
}
