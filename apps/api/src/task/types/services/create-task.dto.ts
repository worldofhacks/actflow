import { TransactionInfoDocument } from '../../../agents/schemas/transaction-info.schema';

import { TaskState } from '../../../contracts';

export interface CreateTaskServiceDto {
  taskId: string;
  metadataId: string;
  creator: string;
  reward: string;
  topic: string;
  state: TaskState;
  executionDuration: number;
  submissionDuration: number;

  assignedAgentId: string;
  invitedAgentIds: string[];

  validationReward: string;

  isBlockchainConfirmed: boolean;
  createdTransaction?: TransactionInfoDocument;
}
