export interface TaskFilterDto {
  state?: number;
  creatorWallets?: string[];
  assignedAgent?: string;
  topic?: string;
  offset?: number;
  limit?: number;
}

export interface AgentFilterDto {
  topics?: string[];
  skills?: string[];
  isPaused?: boolean;
  isDeleted?: boolean;
  isAutoAssigned?: boolean;
  offset?: number;
  limit?: number;
}
