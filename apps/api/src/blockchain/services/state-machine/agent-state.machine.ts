// agent-state-machine.ts
import { Injectable } from '@nestjs/common';
import { AgentService } from '../../../agents/services/agent.service';
export enum AgentState {
  UNREGISTERED = 0,
  ACTIVE = 1,
  PAUSED = 2,
}

export enum AgentActionType {
  REGISTER = 'register',
  UPDATE_PARAMS = 'update-params',
  UPDATE_METADATA = 'update-metadata',
  UPDATE_TOPICS = 'update-topics',
  PAUSE = 'pause',
  UNPAUSE = 'unpause',
  INVITE = 'invite',
  ASSIGN_TASK = 'assign-task',
  COMPLETE_TASK = 'complete-task',
}

// Define valid transitions between states based on actions
export const validAgentTransitions = {
  [AgentState.UNREGISTERED]: {
    [AgentActionType.REGISTER]: AgentState.ACTIVE,
  },
  [AgentState.ACTIVE]: {
    [AgentActionType.UPDATE_PARAMS]: AgentState.ACTIVE,
    [AgentActionType.UPDATE_METADATA]: AgentState.ACTIVE,
    [AgentActionType.UPDATE_TOPICS]: AgentState.ACTIVE,
    [AgentActionType.PAUSE]: AgentState.PAUSED,
    [AgentActionType.INVITE]: AgentState.ACTIVE,
    [AgentActionType.ASSIGN_TASK]: AgentState.ACTIVE,
    [AgentActionType.COMPLETE_TASK]: AgentState.ACTIVE,
  },
  [AgentState.PAUSED]: {
    [AgentActionType.UPDATE_PARAMS]: AgentState.PAUSED,
    [AgentActionType.UPDATE_METADATA]: AgentState.PAUSED,
    [AgentActionType.UPDATE_TOPICS]: AgentState.PAUSED,
    [AgentActionType.UNPAUSE]: AgentState.ACTIVE,
  },
};

@Injectable()
export class AgentStateMachine {
  constructor(private readonly agentService: AgentService) {}

  determineAgentState(agent: any): AgentState {
    if (!agent || !agent.agentId) return AgentState.UNREGISTERED;
    if (agent.isPaused) return AgentState.PAUSED;
    return AgentState.ACTIVE;
  }

  isValidTransition(currentState: AgentState, action: AgentActionType): boolean {
    return !!validAgentTransitions[currentState]?.[action];
  }

  async enforceTransition(
    agentAddress: string,
    action: AgentActionType,
    isHistorical: boolean = false,
  ): Promise<void> {
    if (isHistorical) return; // Skip validation for historical events

    try {
      const agent = await this.agentService.findPopulatedByAgentId(agentAddress);
      const currentState = this.determineAgentState(agent);

      if (!this.isValidTransition(currentState, action)) {
        throw new Error(
          `Invalid agent transition from ${AgentState[currentState]} using action ${action}`,
        );
      }
    } catch (error) {
      // Allow registration of new agents
      if (error.message.includes('not found') && action === AgentActionType.REGISTER) {
        return;
      }
      throw error;
    }
  }
}
