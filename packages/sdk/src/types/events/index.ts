import { Address, TokenAmount, TokenId } from "../market.types";

export type MarketplaceEvent =
  | SetConfigEvent
  | SetValidTopicEvent
  | RegisterAgentEvent
  | SetAgentTopicEvent
  | SetAgentMetadataEvent
  | SetAgentPausedEvent
  | StakeValidatorEvent
  | CreateTaskEvent
  | AgentInviteEvent
  | AssignTaskByAgentEvent
  | AssignTaskByClientEvent
  | SubmitTaskEvent
  | DeclineTaskEvent
  | InvalidateTaskEvent
  | CompleteTaskEvent
  | DisputeTaskEvent
  | ResolveTaskEvent
  | DeleteTaskEvent
  | WithdrawEvent;

// ACTMarketplaceEVM emits SetConfig() with no parameters.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SetConfigEvent {}

export interface StakeValidatorEvent {
  sender: Address;
  expireAtTs: number;
}

export interface DeclineTaskEvent {
  taskId: TokenId;
}

export interface CompleteTaskEvent {
  taskId: TokenId;
}

export interface InvalidateTaskEvent {
  taskId: TokenId;
}

export interface SetServiceFeeEvent {
  serviceFee: number; //uint8
}

export interface SetServiceDelayEvent {
  serviceDelay: number; //uint32
}
export interface SetValidTopicEvent {
  topic: string; //bytes32
  state: boolean;
}

export interface RegisterAgentEvent {
  agent: Address;
}

export interface SetAgentTopicEvent {
  agent: Address;
  topic: string; //bytes32
  state: boolean;
}

export interface SetAgentParamsEvent {
  agent: Address;
  autoAssign: boolean;
  fee: TokenAmount; //uint
  executionDuration: number; //uint32
}

export interface SetAgentMetadataEvent {
  agent: Address;
}

export interface SetAgentPausedEvent {
  agent: Address;
  state: boolean;
}

export interface CreateTaskEvent {
  owner: Address;
  taskId: TokenId;
}

export interface AssignTaskByAgentEvent {
  taskId: TokenId;
  agent: Address;
}

export interface AssignTaskByClientEvent {
  taskId: TokenId;
  agent: Address;
}

export interface AgentInviteEvent {
  agent: Address;
  taskId: TokenId;
}

export interface SubmitTaskEvent {
  taskId: TokenId;
  result: string;
}

export interface DisputeTaskEvent {
  taskId: TokenId;
  reason: string;
}

export interface ResolveTaskEvent {
  taskId: TokenId;
  clientAmount: TokenAmount;
  agentAmount: TokenAmount;
  validatorAmount: TokenAmount;
}

export interface ValidateTaskEvent {
  taskId: TokenId;
}

export interface DeleteTaskEvent {
  taskId: TokenId;
}

export interface WithdrawEvent {
  client: Address;
  amount: TokenAmount;
  feeAmount: TokenAmount;
}
