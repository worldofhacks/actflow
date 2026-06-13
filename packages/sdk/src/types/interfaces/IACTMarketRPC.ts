// interfaces/IACTMarketRPC.ts
import {
  Address,
  MarketLibAgentInfo,
  MarketLibAgentTotals,
  MarketLibClientInfo,
  MarketLibMarketTotals,
  MarketLibTask,
  TokenId,
  TokenAmount,
  AggregateData,
  BalanceLock,
  MarketLibValidator,
  MarketLibValidatorTopic,
  MarketLibAgentTopic,
  MarketLibFullAgent,
} from "../market.types";

import {
  RegisterAgentParams,
  SetAgentMetadataParams,
  SetAgentTopicsParams,
  SetAgentPausedParams,
  CreateTasksParams,
  AssignTaskByClientParams,
  AssignTaskByAgentParams,
  SubmitTaskParams,
  DisputeTaskParams,
  ResolveTaskParams,
  WithdrawParams,
  DeleteTasksParams,
  ValidateTaskParams,
  StakeValidatorParams,
  SetValidTopicsParams,
  SetConfigParams,
} from "../params";

export interface TxResponse {
  transactionHash: string;
  blockNumber: number;
  events: Record<string, any>;
}

export interface RegisterAgentResponse extends TxResponse {
  agentId: Address;
}

export interface CreateTasksResponse extends TxResponse {
  taskIds: TokenId[];
}

export interface SubmitTaskResponse extends TxResponse {
  taskId: TokenId;
  result: string;
}

export interface StandardTxResponse extends TxResponse {
  success: boolean;
}

export interface StakeValidatorResponse extends TxResponse {
  validatorId: Address;
  expireAtTs: number;
}
export interface UnlockBalanceResponse extends TxResponse {
  unlocked: TokenAmount;
}

// Require wallet ($$$)
export interface IACTMarketRPCWritable {
  setConfig(dto: SetConfigParams): Promise<StandardTxResponse>;
  // Topic management
  setValidTopics(dto: SetValidTopicsParams): Promise<StandardTxResponse>;

  // Agent and profile management
  registerAgent(dto: RegisterAgentParams): Promise<RegisterAgentResponse>;
  setAgentMetadata(dto: SetAgentMetadataParams): Promise<StandardTxResponse>;
  setAgentTopics(dto: SetAgentTopicsParams): Promise<StandardTxResponse>;
  setAgentPaused(dto: SetAgentPausedParams): Promise<StandardTxResponse>;

  // Task management
  createTasks(dto: CreateTasksParams): Promise<CreateTasksResponse>;
  assignTaskByClient(
    dto: AssignTaskByClientParams
  ): Promise<StandardTxResponse>;
  assignTaskByAgent(dto: AssignTaskByAgentParams): Promise<StandardTxResponse>;
  submitTask(dto: SubmitTaskParams): Promise<SubmitTaskResponse>;
  validateTask(dto: ValidateTaskParams): Promise<StandardTxResponse>;
  deleteTasks(dto: DeleteTasksParams): Promise<StandardTxResponse>;
  disputeTask(dto: DisputeTaskParams): Promise<StandardTxResponse>;
  resolveTask(dto: ResolveTaskParams): Promise<StandardTxResponse>;

  stakeValidator(dto: StakeValidatorParams): Promise<StakeValidatorResponse>; //register validator
  // Financial operations
  withdraw(dto: WithdrawParams): Promise<StandardTxResponse>;
  unlockBalance(account: Address): Promise<UnlockBalanceResponse>;
}

// Read-only operations that don't require wallet
export interface IACTMarketRPCReadable {
  // Topic information
  getValidTopics(start: number, count: number): Promise<string[]>;

  // Agent information
  getAgent(address: Address): Promise<MarketLibFullAgent>;
  agentTopics(agent: Address, topic: string): Promise<MarketLibAgentTopic[]>;
  isAgentPaused(agentAddr: Address): Promise<boolean>;

  getValidator(address: Address): Promise<MarketLibValidator>;
  getValidatorTopic(
    validator: Address,
    topic: string
  ): Promise<MarketLibValidatorTopic>;
  validatorStakeDuration(): Promise<number>;
  validatorStakeAmount(): Promise<TokenAmount>;

  // Task information
  getTask(taskId: TokenId): Promise<MarketLibTask>;

  // Client information
  getClient(address: Address): Promise<MarketLibClientInfo>;
  getClientTasksList(address: Address): Promise<TokenId[]>;
  isClientTask(client: Address, taskId: TokenId): Promise<boolean>;

  // Task interactions
  getTaskInvitations(taskId: TokenId): Promise<Address[]>;

  // Balance operations
  aggregate(account: Address): Promise<AggregateData>;
  balances(account: Address): Promise<TokenAmount>;
  balanceLocks(account: Address, index: number): Promise<BalanceLock>;
  lockedBalance(account: Address): Promise<TokenAmount>;
  lockedBalanceByTask(account: Address, taskId: TokenId): Promise<TokenAmount>;

  // Market statistics
  marketTotals(): Promise<MarketLibMarketTotals>;

  // Contract information
  serviceDelay(): Promise<number>;
  validationDelay(): Promise<number>;
  serviceFee(): Promise<number>;
  feeBasis(): Promise<number>;
  REVENUE_TOKEN(): Promise<Address>;

  // Contract metadata
  isPaused(): Promise<boolean>;
  owner(): Promise<Address>;
  getContractAddress(): Promise<string>;
}

export interface IACTMarketRPC
  extends IACTMarketRPCReadable,
    IACTMarketRPCWritable {}
