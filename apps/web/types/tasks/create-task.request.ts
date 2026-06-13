import { TaskPayload } from './domain/task-payload';

export interface CreateTaskBaseRequest {
  fromWallet: string;
  topic: string;
  reward: string;
  contextId: string;
  submissionDuration?: number;
  validationReward?: string;
  executionDuration?: number;
  serviceApprove?: boolean;
  payload: TaskPayload;
}

export type CreateOpenTaskRequest = CreateTaskBaseRequest;

export interface CreateInviteTaskRequest extends CreateTaskBaseRequest {
  invitedAgents: string[];
}

export interface CreateAssignedTaskRequest extends CreateTaskBaseRequest {
  assignedAgent: string;
  agentSignature?: string;
  agentSignatureExpire?: number;
}

export type CreateTaskRequest =
  | CreateOpenTaskRequest
  | CreateInviteTaskRequest
  | CreateAssignedTaskRequest;
