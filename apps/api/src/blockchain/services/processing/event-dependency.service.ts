import { Injectable, Logger } from '@nestjs/common';
import { BlockchainEventDocument } from '../../schema/chain-event.schema';
import { BlockchainEventService } from '../blockchain/blockchain-event.service';

export interface EventDependency {
  eventName: string;
  requiresField: string;
  waitingMessage: string;
  optional?: boolean;
}

export interface DependencyGrouping {
  [field: string]: EventDependency[];
}

export interface DependencyCheckResult {
  satisfied: boolean;
  waitingFor?: {
    eventNames: string[];
    field: string;
    value: any;
    message: string;
  };
}

@Injectable()
export class EventDependencyService {
  private readonly logger = new Logger(EventDependencyService.name);
  private readonly eventDependencies: Record<string, EventDependency[]>;

  constructor(private readonly blockchainEventService: BlockchainEventService) {
    this.eventDependencies = this.initializeDependencies();
  }

  private initializeDependencies(): Record<string, EventDependency[]> {
    return {
      AssignTaskByAgent: [
        {
          eventName: 'CreateTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task creation event',
        },
        {
          eventName: 'AgentInvite',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for agent invitation',
        },
      ],
      AssignTaskByClient: [
        {
          eventName: 'CreateTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task creation event',
        },
      ],
      SubmitTask: [
        {
          eventName: 'AssignTaskByAgent',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task assignment by agent',
          optional: true,
        },
        {
          eventName: 'AssignTaskByClient',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task assignment by client',
          optional: true,
        },
      ],
      CompleteTask: [
        {
          eventName: 'SubmitTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task submission',
        },
      ],
      ValidateTask: [
        {
          eventName: 'SubmitTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task submission',
        },
      ],
      DeclineTask: [
        {
          eventName: 'SubmitTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task submission',
        },
      ],
      DisputeTask: [
        {
          eventName: 'ValidateTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task validation',
          optional: true,
        },
        {
          eventName: 'DeclineTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task rejection',
          optional: true,
        },
      ],
      ResolveTask: [
        {
          eventName: 'DisputeTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task dispute',
        },
      ],
      DeleteTask: [
        {
          eventName: 'CreateTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task creation event',
        },
      ],

      // Agent events
      SetAgentTopic: [
        {
          eventName: 'RegisterAgent',
          requiresField: 'agent',
          waitingMessage: 'Waiting for agent registration',
        },
      ],
      SetAgentMetadata: [
        {
          eventName: 'RegisterAgent',
          requiresField: 'agent',
          waitingMessage: 'Waiting for agent registration',
        },
      ],
      SetAgentPaused: [
        {
          eventName: 'RegisterAgent',
          requiresField: 'agent',
          waitingMessage: 'Waiting for agent registration',
        },
      ],
      AgentInvite: [
        {
          eventName: 'RegisterAgent',
          requiresField: 'agent',
          waitingMessage: 'Waiting for agent registration',
        },
        {
          eventName: 'CreateTask',
          requiresField: 'taskId',
          waitingMessage: 'Waiting for task creation',
        },
      ],

      StakeValidator: [],
    };
  }

  private groupDependenciesByField(dependencies: EventDependency[]): DependencyGrouping {
    const groupedDeps: DependencyGrouping = {};

    dependencies.forEach(dep => {
      if (!groupedDeps[dep.requiresField]) {
        groupedDeps[dep.requiresField] = [];
      }
      groupedDeps[dep.requiresField].push(dep);
    });

    return groupedDeps;
  }

  async checkPrerequisites(event: BlockchainEventDocument): Promise<DependencyCheckResult> {
    const dependencies = this.eventDependencies[event.eventName];

    if (!dependencies || dependencies.length === 0) {
      return { satisfied: true };
    }

    const dependenciesByField = this.groupDependenciesByField(dependencies);

    for (const field of Object.keys(dependenciesByField)) {
      if (!event[field]) {
        continue;
      }

      const deps = dependenciesByField[field];
      let fieldSatisfied = false;

      for (const dependency of deps) {
        const hasProcessed = await this.blockchainEventService.hasProcessedEvent(
          dependency.eventName,
          event[dependency.requiresField],
        );

        if (hasProcessed) {
          fieldSatisfied = true;
          break;
        }
      }

      if (!fieldSatisfied) {
        const eventNames = deps.map(d => d.eventName);
        const field = deps[0].requiresField;
        const value = event[field];
        const message = `${deps[0].waitingMessage} (${eventNames.join(' OR ')} -> ${value})`;

        this.logger.log(
          `Event ${event._id} (${event.eventName}) waiting for ${eventNames.join(' OR ')} with ${field}: ${value}`,
        );

        return {
          satisfied: false,
          waitingFor: {
            eventNames,
            field,
            value,
            message,
          },
        };
      }
    }

    return { satisfied: true };
  }

  getDependenciesForEvent(eventName: string): EventDependency[] {
    return this.eventDependencies[eventName] || [];
  }

  hasEventDependencies(eventName: string): boolean {
    return !!this.eventDependencies[eventName] && this.eventDependencies[eventName].length > 0;
  }
}
