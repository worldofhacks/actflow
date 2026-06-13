import { Injectable, Logger } from '@nestjs/common';
import {
  BlockchainEventDocument,
  EventProcessingStatus,
  WaitingDependency,
} from '../../schema/chain-event.schema';
import { BlockchainEventService } from '../blockchain/blockchain-event.service';

//This service listen for events that are waiting for dependencies and mark them as pending when the dependencies are satisfied
@Injectable()
export class WaitingEventService {
  private readonly logger = new Logger(WaitingEventService.name);
  private readonly MAX_WAITING_RETRY = 5;
  private readonly BASE_RETRY_DELAY_MS = 1000; // 1 second
  private readonly MAX_RETRY_DELAY_MS = 300000; // 5 minutes

  constructor(private readonly blockchainEventService: BlockchainEventService) {}

  async processWaitingEvents(): Promise<void> {
    const waitingEvents = await this.blockchainEventService.getWaitingEvents(
      this.MAX_WAITING_RETRY,
    );

    if (waitingEvents.length === 0) return;

    this.logger.log(`Processing ${waitingEvents.length} waiting events`);

    for (const event of waitingEvents) {
      try {
        const waitingFor = event.waitingFor;
        if (!waitingFor) continue;

        const eventNames = waitingFor.eventName.split('|');
        let dependencySatisfied = false;

        for (const eventName of eventNames) {
          const hasProcessed = await this.blockchainEventService.hasProcessedEvent(
            eventName,
            waitingFor.value,
          );

          if (hasProcessed) {
            dependencySatisfied = true;
            break;
          }
        }

        if (dependencySatisfied) {
          await this.blockchainEventService.updateEventStatus(
            event._id.toString(),
            EventProcessingStatus.PENDING,
          );

          this.logger.log(
            `Event ${event._id} (${event.eventName}) dependencies satisfied, marked for processing`,
          );
        } else {
          await this.scheduleRetry(event);

          this.logger.debug(
            `Event ${event._id} (${event.eventName}) still waiting for dependencies`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error processing waiting event ${event._id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  async markEventAsWaiting(
    event: BlockchainEventDocument,
    waitingFor: {
      eventNames: string[];
      field: string;
      value: any;
      message: string;
    },
  ): Promise<void> {
    await this.blockchainEventService.updateEventStatus(
      event._id.toString(),
      EventProcessingStatus.WAITING,
      waitingFor.message,
    );

    // Record specific dependency information
    const waitingDependency: WaitingDependency = {
      eventName: waitingFor.eventNames.join('|'), // List all alternatives with a separator
      field: waitingFor.field,
      value: waitingFor.value,
    };

    await this.blockchainEventService.updateEventWaitingDependency(
      event._id.toString(),
      waitingDependency.eventName,
      waitingDependency.field,
      waitingDependency.value,
    );

    // Schedule next retry with backoff
    await this.scheduleRetry(event);
  }

  private calculateBackoff(retryCount: number): number {
    return Math.min(this.MAX_RETRY_DELAY_MS, this.BASE_RETRY_DELAY_MS * Math.pow(2, retryCount));
  }

  private async scheduleRetry(event: BlockchainEventDocument): Promise<void> {
    const retryCount = event.waitingRetryCount || 0;

    if (retryCount >= this.MAX_WAITING_RETRY) {
      this.logger.warn(
        `Event ${event._id} (${event.eventName}) exceeded max retries while waiting for dependencies`,
      );
      return;
    }

    const nextRetry = new Date();
    nextRetry.setTime(nextRetry.getTime() + this.calculateBackoff(retryCount));

    await this.blockchainEventService.updateWaitingRetrySchedule(
      event._id.toString(),
      nextRetry,
      retryCount + 1,
    );
  }
}
