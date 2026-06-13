import { AgentTopicSkill } from '../../core/agent-topic';
import { TransactionInfoDocument } from '../../schemas/transaction-info.schema';

export interface CreateAgentServiceDto {
  agentId: string;
  metadataId: string;
  topic: string;
  skills: AgentTopicSkill[];
  isBlockchainConfirmed: boolean;
  isMetadataDefault: boolean;

  creationTransaction?: TransactionInfoDocument;
}
