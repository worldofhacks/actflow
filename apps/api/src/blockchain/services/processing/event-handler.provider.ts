import { Injectable, OnModuleInit } from '@nestjs/common';

// Import all handlers
import {
  AgentInviteHandler,
  AssignTaskByAgentHandler,
  AssignTaskByClientHandler,
  CompleteTaskHandler,
  CreateTaskHandler,
  DeclineTaskHandler,
  DeleteTaskHandler,
  DisputeTaskHandler,
  RegisterAgentHandler,
  ResolveTaskHandler,
  SetAgentMetadataHandler,
  SetAgentParamsHandler,
  SetAgentPausedHandler,
  SetAgentTopicHandler,
  SetConfigHandler,
  SetValidTopicHandler,
  StakeValidatorHandler,
  SubmitTaskHandler,
  ValidateTaskHandler,
  WithdrawHandler,
} from '../../handlers/handlers';
import { EventHandlerRegistry } from './event-handler.registry';

/**
 * Provider that registers all event handlers with the registry
 */
@Injectable()
export class EventHandlerProvider implements OnModuleInit {
  constructor(
    private readonly handlerRegistry: EventHandlerRegistry,

    // Task handlers
    private readonly createTaskHandler: CreateTaskHandler,
    private readonly assignTaskByAgentHandler: AssignTaskByAgentHandler,
    private readonly assignTaskByClientHandler: AssignTaskByClientHandler,
    private readonly submitTaskHandler: SubmitTaskHandler,
    private readonly completeTaskHandler: CompleteTaskHandler,
    private readonly disputeTaskHandler: DisputeTaskHandler,
    private readonly resolveTaskHandler: ResolveTaskHandler,
    private readonly deleteTaskHandler: DeleteTaskHandler,
    private readonly declineTaskHandler: DeclineTaskHandler,
    private readonly validateTaskHandler: ValidateTaskHandler,
    // Agent handlers
    private readonly registerAgentHandler: RegisterAgentHandler,
    private readonly setAgentTopicHandler: SetAgentTopicHandler,
    private readonly setAgentParamsHandler: SetAgentParamsHandler,
    private readonly setAgentMetadataHandler: SetAgentMetadataHandler,
    private readonly setAgentPausedHandler: SetAgentPausedHandler,
    private readonly agentInviteHandler: AgentInviteHandler,

    // Misc handlers
    private readonly setValidTopicHandler: SetValidTopicHandler,
    private readonly withdrawHandler: WithdrawHandler,
    private readonly setConfigHandler: SetConfigHandler,

    // Validator handlers
    private readonly stakeValidatorHandler: StakeValidatorHandler,
  ) {}

  async onModuleInit() {
    // Register all handlers
    this.handlerRegistry.registerHandlers([
      // Task handlers
      this.createTaskHandler,
      this.assignTaskByAgentHandler,
      this.assignTaskByClientHandler,
      this.submitTaskHandler,
      this.completeTaskHandler,
      this.disputeTaskHandler,
      this.resolveTaskHandler,
      this.deleteTaskHandler,
      this.declineTaskHandler,
      this.validateTaskHandler,

      // Validator handlers
      this.stakeValidatorHandler,
      // Agent handlers
      this.registerAgentHandler,
      this.setAgentTopicHandler,
      this.setAgentParamsHandler,
      this.setAgentMetadataHandler,
      this.setAgentPausedHandler,
      this.agentInviteHandler,

      // Misc handlers
      this.setValidTopicHandler,
      this.withdrawHandler,
      this.setConfigHandler,
    ]);
  }
}
