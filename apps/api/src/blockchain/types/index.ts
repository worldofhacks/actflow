import { Address, MarketLibTask, TaskState, TokenId } from '../../contracts';

//remove
export interface EnrichedTaskCompletedEvent {
  taskId: TokenId;
  requestingAgent: Address;
  assignedAgent: Address;
  result: string;
  task: MarketLibTask;
  parsedResult: any; // JSON-parsed result if possible
}

export interface AgentCreatedMQEvent extends BaseMQEvent {
  agent: Address;
  txId: string;
}

export interface TaskStateChangeMQEvent extends BaseMQEvent {
  taskId: string;
  status: TaskState;
}

export interface TaskCompletedMQEvent extends TaskStateChangeMQEvent {
  status: TaskState.COMPLETED;
}

export interface TaskResolvedMQEvent extends TaskStateChangeMQEvent {
  status: TaskState.RESOLVED;
}

export interface TaskCreatedMQEvent extends BaseMQEvent {
  taskId: string;
}

export interface AgentCreatedMqEvent extends BaseMQEvent {
  agentAddress: Address;
}

export interface BaseMQEvent {
  eventId: any;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
}

// Agent events
export interface AgentCreatedMqEvent extends BaseMQEvent {
  agentAddress: string;
}

export interface AgentTopicChangedMQEvent extends BaseMQEvent {
  agent: string;
  topic: string;
  state: boolean;
}

export interface AgentParamsChangedMQEvent extends BaseMQEvent {
  agent: string;
  autoAssign: boolean;
  fee: string;
  executionDuration: number;
}

export interface AgentMetadataChangedMQEvent extends BaseMQEvent {
  agent: string;
}

export interface AgentPausedChangedMQEvent extends BaseMQEvent {
  agent: string;
  state: boolean;
}

export interface TaskClientAssignedMQEvent extends TaskStateChangeMQEvent {
  assignedAgent: string;
}

export interface TaskAgentAssignedMQEvent extends TaskStateChangeMQEvent {
  assignedAgent: string;
}

export interface TaskSubmittedMQEvent extends TaskStateChangeMQEvent {
  result: string;
}

export type TaskApprovedMQEvent = TaskStateChangeMQEvent;

export interface TaskDisputedMQEvent extends TaskStateChangeMQEvent {
  reason: string;
}

export interface TaskResolvedMQEvent extends TaskStateChangeMQEvent {
  clientAmount: string;
  agentAmount: string;
}

export type TaskDeletedMQEvent = TaskStateChangeMQEvent;

// Other events
export interface AgentInviteMQEvent extends BaseMQEvent {
  agent: string;
  taskId: string;
}

export interface WithdrawMQEvent extends BaseMQEvent {
  client: string;
  amount: string;
  feeAmount: string;
}

export interface ValidTopicChangedMQEvent extends BaseMQEvent {
  topic: string;
  state: boolean;
}
