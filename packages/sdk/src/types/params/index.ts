import {
  Address,
  MarketLibAgentTopic,
  TokenAmount,
  TokenId,
} from "../market.types";

export interface RegisterAgentParams {
  metadata: string;
  topics: string[];
  topicsData: MarketLibAgentTopic[];
}

export interface ValidateTaskParams {
  taskId: TokenId;
  approved: boolean;
  result: string;
}

export interface DeleteTasksParams {
  tasks: TokenId[];
  withdraw: boolean;
}

export interface CreateTasksParams {
  tasks: NewTaskParams[];
}

export interface NewTaskParams {
  state: number; // TaskState
  reward: TokenAmount;
  submissionDuration: number;
  executionDuration: number;
  topic: string;
  payload: string;
  agents: Address[];
  agentSignature?: string;
  agentSignatureExpire?: number;
  validationReward: TokenAmount;
}

export interface AssignTaskByClientParams {
  taskId: TokenId;
  agent: Address;
  reward: TokenAmount;
  executionDuration: number;
  agentSignature: string;
  agentSignatureExpire: number;
  validationReward: TokenAmount;
}

export interface AssignTaskByAgentParams {
  taskId: TokenId;
  reward: TokenAmount;
  executionDuration: number;
}

export interface SubmitTaskParams {
  taskId: TokenId;
  result: string;
}

export interface DisputeTaskParams {
  taskId: TokenId;
  reason: string;
}

export interface ResolveTaskParams {
  taskId: TokenId;
  clientAmount: TokenAmount;
  agentAmount: TokenAmount;
  validatorAmount: TokenAmount;
  results: string;
}

export interface SetAgentMetadataParams {
  metadata: string;
}

export interface SetAgentTopicsParams {
  topics: string[];
  topicsData: MarketLibAgentTopic[];
}

export interface SetAgentPausedParams {
  agent: Address;
  state: boolean;
}

export interface WithdrawParams {
  amount: TokenAmount;
}

export interface StakeValidatorParams {
  metadata: string;
}

export interface SetServiceFeeParams {
  serviceFee: number; // uint8
}
export interface SetServiceDelayParams {
  serviceDelay: number; // uint32
}
export interface UnlockBalanceParams {
  account: Address;
}
export interface UnlockBalanceByTaskParams {
  account: Address;
  taskId: TokenId;
}

export interface GetValidatorParams {
  address: Address;
}

export interface GetValidatorTopicParams {
  validator: Address;
  topic: string;
}

export interface GetAgentTopicParams {
  agent: Address;
  topic: string;
}

export interface SetValidTopicsParams {
  topics: string[];
  state: boolean;
}

export interface SetConfigParams {
  serviceFee: number; // uint8
  serviceDelay: number; // uint32
  validationDelay: number; // uint32
  validatorStakeDuration: number; // uint32
  validatorStakeAmount: TokenAmount; // uint128
}
