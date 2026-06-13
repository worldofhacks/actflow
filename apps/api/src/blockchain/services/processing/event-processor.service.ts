import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { BlockchainEventDocument, EventProcessingStatus } from '../../schema/chain-event.schema';
import { BlockchainEventService } from '../blockchain/blockchain-event.service';
import { EventDependencyService } from './event-dependency.service';
import { EventHandlerRegistry } from './event-handler.registry';
import { WaitingEventService } from './waiting-event.service';

// Interval constants (in milliseconds)
const RESET_FAILED_EVENTS_INTERVAL = 5_000;
const SCHEDULE_PROCESSING_INTERVAL = 5_000;
const RETRY_WAITING_EVENTS_INTERVAL = 15_000;

@Injectable()
export class EventProcessorService implements OnModuleInit {
  private readonly logger = new Logger(EventProcessorService.name);
  private isProcessing = false;
  private readonly MAX_BATCH_SIZE = 200;

  constructor(
    private readonly blockchainEventService: BlockchainEventService,
    private readonly eventHandlerRegistry: EventHandlerRegistry,
    private readonly eventDependencyService: EventDependencyService,
    private readonly waitingEventService: WaitingEventService,
  ) {}

  async onModuleInit() {
    try {
      await this.processEvents();
      this.logger.log('Initial event processing completed');
    } catch (error) {
      this.logger.error(`Error during initial event processing: ${error.message}`);
    }
  }

  @Interval(SCHEDULE_PROCESSING_INTERVAL)
  async scheduleProcessing() {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      await this.processEvents();
    } catch (error) {
      this.logger.error(`Error in scheduled processing: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  @Interval(RESET_FAILED_EVENTS_INTERVAL)
  async resetFailedEvents() {
    try {
      const resetCount = await this.blockchainEventService.resetFailedEvents(3);
      if (resetCount > 0) {
        this.logger.log(`Reset ${resetCount} failed events for retry`);
      }
    } catch (error) {
      this.logger.error(`Error resetting failed events: ${error.message}`);
    }
  }

  @Interval(RETRY_WAITING_EVENTS_INTERVAL)
  async retryWaitingEvents() {
    if (this.isProcessing) {
      return;
    }

    try {
      const waitingEvents = await this.blockchainEventService.getWaitingEvents(this.MAX_BATCH_SIZE);

      for (const event of waitingEvents) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error(`Error processing waiting events: ${error.message}`);
    }
  }

  private async processEvents() {
    const events = await this.blockchainEventService.getNextUnprocessedEvents(this.MAX_BATCH_SIZE);

    if (events.length === 0) {
      return;
    }

    // Sort events by block number, transaction index, and log index to maintain chronological order
    events.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      if (a.transactionIndex !== b.transactionIndex) return a.transactionIndex - b.transactionIndex;
      return a.logIndex - b.logIndex;
    });

    // Group events by eventName to process base events first
    const eventGroups = this.groupEventsByPriority(events);

    // Process event groups one by one
    for (const group of eventGroups) {
      for (const event of group) {
        await this.processEvent(event);
      }
    }
  }

  private groupEventsByPriority(events: BlockchainEventDocument[]): BlockchainEventDocument[][] {
    const priorityGroups = [
      ['SetConfig', 'SetValidTopic'],
      ['RegisterAgent', 'StakeValidator', 'CreateTask'],
      [
        'SetAgentTopic',
        'SetAgentMetadata',
        'AgentInvite',
        'AssignTaskByAgent',
        'AssignTaskByClient',
      ],
      ['SubmitTask'],
      ['ValidateTask', 'CompleteTask', 'DeclineTask', 'DisputeTask', 'ResolveTask', 'DeleteTask'],
      ['Withdraw'],
    ];

    // Initialize result array with same number of groups as priority tiers
    const result: BlockchainEventDocument[][] = Array(priorityGroups.length + 1)
      .fill(null)
      .map(() => []);

    // Place each event in its appropriate tier
    for (const event of events) {
      let placed = false;

      // Check each priority tier
      for (let i = 0; i < priorityGroups.length; i++) {
        if (priorityGroups[i].includes(event.eventName)) {
          result[i].push(event);
          placed = true;
          break;
        }
      }

      // If not found in any tier, put in the last group
      if (!placed) {
        result[priorityGroups.length].push(event);
      }
    }

    // Keep the chronological order within each group
    for (const group of result) {
      group.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
        if (a.transactionIndex !== b.transactionIndex)
          return a.transactionIndex - b.transactionIndex;
        return a.logIndex - b.logIndex;
      });
    }

    return result;
  }

  private async processEvent(event: BlockchainEventDocument) {
    try {
      const handler = this.eventHandlerRegistry.getHandler(event.eventName);

      if (!handler) {
        this.logger.warn(`No handler available for event: ${event.eventName}`);
        await this.blockchainEventService.updateEventStatus(
          event._id.toString(),
          EventProcessingStatus.PROCESSED,
          'No handler available',
        );
        return;
      }

      if (this.eventDependencyService.hasEventDependencies(event.eventName)) {
        const dependencyResult = await this.eventDependencyService.checkPrerequisites(event);

        if (!dependencyResult.satisfied) {
          this.logger.log(
            `Event ${event._id} (${event.eventName}) waiting: ${dependencyResult.waitingFor?.message}`,
          );

          // Mark as waiting with the reason
          await this.blockchainEventService.updateEventStatus(
            event._id.toString(),
            EventProcessingStatus.WAITING,
            dependencyResult.waitingFor?.message,
          );
          return;
        }
      }

      await this.blockchainEventService.updateEventStatus(
        event._id.toString(),
        EventProcessingStatus.PROCESSING,
      );

      await handler.handle(event);

      await this.blockchainEventService.updateEventStatus(
        event._id.toString(),
        EventProcessingStatus.PROCESSED,
      );
    } catch (err) {
      this.logger.error(
        `Error processing event ${event._id} (${event.eventName}): ${err.message}`,
        err.stack,
      );

      // Mark as failed
      await this.blockchainEventService.updateEventStatus(
        event._id.toString(),
        EventProcessingStatus.FAILED,
        err.message,
        err,
      );
    }
  }
}
