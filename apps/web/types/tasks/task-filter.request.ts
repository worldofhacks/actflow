import { TaskState } from './task-state.enum';

export interface TaskFilterRequest {
  state?: TaskState;

  creatorWallets?: string[];
  // by agent
  assignedAgents?: string[];
  invitedAgents?: string[];
  // by topic
  topic?: string;
  validationEligible?: boolean;

  // pagination
  limit?: number;
  offset?: number;
}
