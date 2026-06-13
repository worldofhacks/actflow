import { TaskState } from '../../../contracts';
import { AgentDetailsApiResponse } from '../../../agents/types/response/agent-details.response';
import { TransactionHistoryItem } from '../../../core/types';
import { TaskMetadataApiResponse } from './task-metadata.response';

export interface TaskBaseApiResponse {
  taskId: string;
  topic: string;
  state: TaskState;
  reward: string;
  creator: string;
  blockNumber: number;
  isBlockchainConfirmed: boolean;
}

export interface TaskSummaryApiResponse extends TaskBaseApiResponse {
  assignedAgent?: AgentDetailsApiResponse;
  childIpId?: string;
  childTokenId?: string;
  metadata?: TaskMetadataApiResponse;
}

export interface TaskDetailsApiResponse extends TaskBaseApiResponse {
  assignedAgent?: string;
  childIpId?: string;
  childTokenId?: string;

  assignedValidator?: string;
  metadata?: TaskMetadataApiResponse;
  resultData?: string;
  validationReward?: string;
  executionDuration?: number;
  submissionDuration?: number;

  invitedAgents?: AgentDetailsApiResponse[];
  rating?: number;
  feedback?: string;

  expiredAt?: Date;
  updatedAtTs?: number;
  createdAtTs: number;

  validationDelayExpiresAt?: Date;
  serviceExpiresAt?: Date;
  submissionExpiresAt?: Date;
  assigningExpiresAt?: Date;

  transactions?: TransactionHistoryItem[];
}
