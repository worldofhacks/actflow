export type Address = string;
export type BlockNumber = bigint;
export type Timestamp = bigint;
export type TokenAmount = bigint;
export type TokenId = bigint;

export enum TaskState {
  PENDING = 0,
  INVITED = 1,
  ASSIGNED = 2,
  COMPLETED = 3,
  DELETED = 4,
  SUBMITTED = 5,
  VALIDATED = 6,
  DECLINED_BY_OWNER = 7,
  DECLINED_BY_VALIDATOR = 8,
  DISPUTED_BY_OWNER = 9,
  DISPUTED_BY_AGENT = 10,
  RESOLVED = 11,
  EXPIRED = 12,
}

export interface MarketLibTask {
  id: TokenId; // uint96 in Solidity
  createdAtTs: number; // uint32
  submissionDuration: number; // uint32
  updatedAtTs: number; // uint32
  executionDuration: number; // uint32
  reward: TokenAmount; // uint128
  validationReward: TokenAmount; // uint128
  owner: Address; // address
  assignedAgent: Address; // address
  validator: Address;
  topic: string; // bytes32
  state: TaskState; // TaskState enum
  payload: string; // string
}

export interface MarketLibFullAgent {
  agent: MarketLibAgentInfo;
  topics: MarketLibAgentTopic[];
}

export interface MarketLibAgentInfo {
  id: Address; // address
  metadata: string; // string
  paused: boolean; // bool
  topics: string[]; // bytes32[]
}

export interface MarketLibAgentTopic {
  enabled: boolean;
  fee: TokenAmount; // uint128
  executionDuration: number; // uint32
  metadata: string;
  autoAssign: boolean;
}

export interface MarketLibTaskMetrics {
  creationTime: Timestamp; // uint256
  assignmentTime: Timestamp; // uint256
  completionTime: Timestamp; // uint256
  timeToAssignment: Timestamp; // uint256
  timeToCompletion: Timestamp; // uint256
  rating: number; // uint256 but limited to 1-5
  feedback: string; // string
  disputed: boolean; // bool
  disputeReason: string; // string
}

export interface MarketLibAgentStatistics {
  tasksAssigned: number; // uint32
  tasksCompleted: number; // uint32
  lastActivityTs: number; // uint32
  earnAmount: string; // uint128, using string for bigint in TS
}

export interface MarketLibAgentTotals {
  tasksAssigned: number; // uint32
  tasksCompleted: number; // uint32
  lastActivityTs: number; // uint32
  earnAmount: TokenAmount; // uint128
}

export interface MarketLibClientInfo {
  spent: TokenAmount; // uint128
  tasksCreated: number; // uint32
  tasksAssigned: number; // uint32
  tasksCompleted: number; // uint32
  lastActivityTs: number; // uint32
}

export interface MarketLibTaskResult {
  id: TokenId;
  timestamp: Timestamp;
  blockNumber: BlockNumber;
  result: string;
}

export interface MarketLibMarketTotals {
  done: TokenAmount; // uint256
  rewards: TokenAmount; // uint256
  totalAgents: TokenId; // uint256
  activeAgents: TokenId; // uint256
  totalTasks: TokenId; // uint256
  automaticTasks: TokenId; // uint256
  manualTasks: TokenId; // uint256
  averageReward: TokenAmount; // uint256
}

export interface BalanceLock {
  taskId: number;
  unlockTs: number;
  amount: TokenAmount;
}

export interface AggregateData {
  balance: TokenAmount;
  locked: TokenAmount;
  nativeBalance: bigint;
  rvTokenBalance: bigint;
}

export interface NewTask {
  state: TaskState;
  reward: TokenAmount;
  submissionDuration: number;
  executionDuration: number;
  topic: string;
  payload: string;
  agents: Address[];
  agentSignature: string;
  agentSignatureExpire: number;
  validationReward: TokenAmount;
}

//VALIDATORS

export interface MarketLibValidator {
  id: Address;
  metadata: string;
  paused: boolean;
  expireAtTs: number;
  topics: string[]; //byte32
}

export interface MarketLibValidatorTopic {
  enabled: boolean;
  metadata: string;
  feesEarned: TokenAmount; // uint128
}
