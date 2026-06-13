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
    EXPIRED = 12
}
export interface MarketLibTask {
    id: TokenId;
    createdAtTs: number;
    submissionDuration: number;
    updatedAtTs: number;
    executionDuration: number;
    reward: TokenAmount;
    validationReward: TokenAmount;
    owner: Address;
    assignedAgent: Address;
    validator: Address;
    topic: string;
    state: TaskState;
    childTokenId: TokenId;
    childIpId: Address;
    payload: string;
}
export interface MarketLibTaskStory {
    childTokenId: TokenId;
    childIpId: Address;
    payload: string;
}
export interface MarketLibFullAgent {
    agent: MarketLibAgentInfo;
    topics: MarketLibAgentTopic[];
}
export interface MarketLibAgentInfo {
    id: Address;
    metadata: string;
    paused: boolean;
    topics: string[];
    ipAssetId: Address;
    nftTokenId: TokenId;
    licenseTermsId: TokenId;
}
export interface MarketLibAgentStory {
    ipAssetId: Address;
    nftTokenId: TokenId;
    licenseTermsId: TokenId;
}
export interface MarketLibAgentTopic {
    enabled: boolean;
    fee: TokenAmount;
    executionDuration: number;
    metadata: string;
    autoAssign: boolean;
}
export interface MarketLibTaskMetrics {
    creationTime: Timestamp;
    assignmentTime: Timestamp;
    completionTime: Timestamp;
    timeToAssignment: Timestamp;
    timeToCompletion: Timestamp;
    rating: number;
    feedback: string;
    disputed: boolean;
    disputeReason: string;
}
export interface MarketLibAgentStatistics {
    tasksAssigned: number;
    tasksCompleted: number;
    lastActivityTs: number;
    earnAmount: string;
}
export interface MarketLibAgentTotals {
    tasksAssigned: number;
    tasksCompleted: number;
    lastActivityTs: number;
    earnAmount: TokenAmount;
}
export interface MarketLibClientInfo {
    spent: TokenAmount;
    tasksCreated: number;
    tasksAssigned: number;
    tasksCompleted: number;
    lastActivityTs: number;
}
export interface MarketLibTaskResult {
    id: TokenId;
    timestamp: Timestamp;
    blockNumber: BlockNumber;
    result: string;
}
export interface MarketLibMarketTotals {
    done: TokenAmount;
    rewards: TokenAmount;
    totalAgents: TokenId;
    activeAgents: TokenId;
    totalTasks: TokenId;
    automaticTasks: TokenId;
    manualTasks: TokenId;
    averageReward: TokenAmount;
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
export interface MarketLibValidator {
    id: Address;
    metadata: string;
    paused: boolean;
    expireAtTs: number;
    topics: string[];
}
export interface MarketLibValidatorTopic {
    enabled: boolean;
    metadata: string;
    feesEarned: TokenAmount;
}
