import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlockchainEvent,
  BlockchainEventDocument,
  EventProcessingStatus,
  ProcessingError,
} from '../../schema/chain-event.schema';

@Injectable()
export class BlockchainEventService {
  private readonly logger = new Logger(BlockchainEventService.name);

  constructor(
    @InjectModel(BlockchainEvent.name) private blockchainEventModel: Model<BlockchainEventDocument>,
  ) {}

  async saveEvent(event: Partial<BlockchainEvent>): Promise<BlockchainEventDocument> {
    try {
      const existingEvent = await this.findEvent({
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      });

      if (existingEvent) {
        this.logger.debug(
          `Skipping duplicate event: tx=${event.transactionHash}, log=${event.logIndex}`,
        );
        return;
      }

      // Initialize arrays if not provided
      if (!event.errorList) event.errorList = [];
      if (!event.statusHistory) {
        event.statusHistory = [
          {
            status: event.status || EventProcessingStatus.UNPROCESSED,
            timestamp: new Date(),
            message: 'Event created',
          },
        ];
      }

      // Sanitize event data to prevent unexpected issues
      const sanitizedEvent = {
        ...event,
        status: event.status || EventProcessingStatus.UNPROCESSED,
        processingAttempts: event.processingAttempts || 0,
      };

      const newEvent = new this.blockchainEventModel(sanitizedEvent);
      return newEvent.save();
    } catch (error) {
      this.logger.error(`Error saving event: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findEvent(filter: {
    transactionHash: string;
    logIndex: number;
  }): Promise<BlockchainEventDocument | null> {
    try {
      return this.blockchainEventModel
        .findOne({
          transactionHash: filter.transactionHash,
          logIndex: filter.logIndex,
        })
        .exec();
    } catch (error) {
      this.logger.error(`Error finding event: ${error.message}`, error.stack);
      return null;
    }
  }

  async getNextUnprocessedEvents(limit: number): Promise<BlockchainEventDocument[]> {
    return this.blockchainEventModel
      .find({
        status: {
          $in: [EventProcessingStatus.UNPROCESSED, EventProcessingStatus.PENDING],
        },
      })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .limit(limit)
      .exec();
  }

  async getWaitingEvents(limit: number): Promise<BlockchainEventDocument[]> {
    // const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    return this.blockchainEventModel
      .find({
        status: EventProcessingStatus.WAITING,
        // waitingSince: { $lt: twoMinutesAgo },
      })
      .sort({ waitingSince: 1 })
      .limit(limit)
      .exec();
  }

  async getProcessingEvents(limit: number): Promise<BlockchainEventDocument[]> {
    // Get events that have been waiting for a while (older than 2 minutes)
    // const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    return this.blockchainEventModel
      .find({
        status: EventProcessingStatus.PROCESSING,
        // waitingSince: { $lt: twoMinutesAgo },
      })
      .sort({ waitingSince: 1 })
      .limit(limit)
      .exec();
  }

  async getFailedEvents(limit: number): Promise<BlockchainEventDocument[]> {
    return this.blockchainEventModel
      .find({ status: EventProcessingStatus.FAILED })
      .sort({ lastProcessingAttempt: 1 })
      .limit(limit)
      .exec();
  }

  async updateEventStatus(
    eventId: string,
    status: EventProcessingStatus,
    message?: string,
    error?: Error,
  ): Promise<BlockchainEventDocument> {
    try {
      const now = new Date();
      const updateData: any = {
        status,
        $inc: { processingAttempts: 1 },
        lastProcessingAttempt: now,
      };

      // Add status history entry
      const historyEntry = {
        status,
        timestamp: now,
        message: message || '',
      };

      updateData.$push = { statusHistory: historyEntry };

      // Handle specific status updates
      if (status === EventProcessingStatus.PROCESSED) {
        updateData.processedAt = now;
      } else if (status === EventProcessingStatus.QUEUED) {
        updateData.queuedAt = now;
      } else if (status === EventProcessingStatus.WAITING) {
        updateData.waitingSince = now;
        updateData.errorMessage = message || 'Waiting for dependency';
      } else if (status === EventProcessingStatus.FAILED) {
        updateData.errorMessage = message || 'Processing failed';

        // Add detailed error information
        if (error) {
          const errorEntry: ProcessingError = {
            timestamp: now,
            message: error.message,
            stack: error.stack,
          };

          updateData.$push.errorList = errorEntry;
        } else if (message) {
          const errorEntry: ProcessingError = {
            timestamp: now,
            message,
          };

          updateData.$push.errorList = errorEntry;
        }
      }

      const updatedEvent = await this.blockchainEventModel
        .findByIdAndUpdate(eventId, updateData, { new: true })
        .exec();

      if (!updatedEvent) {
        this.logger.warn(`Event not found for update: ${eventId}`);
        return null;
      }

      return updatedEvent;
    } catch (error) {
      this.logger.error(`Error updating event ${eventId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateWaitingRetrySchedule(
    eventId: string,
    nextRetry: Date,
    retryCount: number,
  ): Promise<BlockchainEventDocument> {
    return this.blockchainEventModel
      .findByIdAndUpdate(
        eventId,
        {
          waitingRetryCount: retryCount,
          nextRetryAt: nextRetry,
        },
        { new: true },
      )
      .exec();
  }

  async updateEventWaitingDependency(
    eventId: string,
    dependentEvent: string,
    field: string,
    value: string,
  ): Promise<BlockchainEventDocument> {
    try {
      const updatedEvent = await this.blockchainEventModel
        .findByIdAndUpdate(
          eventId,
          {
            waitingFor: {
              eventName: dependentEvent,
              field,
              value,
            },
          },
          { new: true },
        )
        .exec();

      if (!updatedEvent) {
        this.logger.warn(`Event not found for dependency update: ${eventId}`);
        return null;
      }

      return updatedEvent;
    } catch (error) {
      this.logger.error(`Error updating event dependency: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addErrorToEvent(
    eventId: string,
    errorMessage: string,
    stack?: string,
  ): Promise<BlockchainEventDocument> {
    const errorEntry: ProcessingError = {
      timestamp: new Date(),
      message: errorMessage,
      stack,
    };

    return this.blockchainEventModel
      .findByIdAndUpdate(
        eventId,
        {
          $push: { errorList: errorEntry },
          errorMessage,
        },
        { new: true },
      )
      .exec();
  }

  async hasProcessedEvent(eventName: string, identifier: string): Promise<boolean> {
    try {
      let query;

      //TODO: Improve this in future
      if (eventName === 'AssignTaskByAgent' || eventName === 'AssignTaskByClient') {
        return await this.isTaskAssigned(identifier);
      } else if (eventName === 'SubmitTask') {
        return await this.isTaskAssigned(identifier);
      } else if (eventName.includes('Task') && !eventName.includes('Agent')) {
        query = { eventName, taskId: identifier, status: EventProcessingStatus.PROCESSED };
      } else {
        query = { eventName, agent: identifier, status: EventProcessingStatus.PROCESSED };
      }

      const count = await this.blockchainEventModel.countDocuments(query).exec();
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking processed event: ${error.message}`, error.stack);
      return false;
    }
  }

  private async isTaskAssigned(taskId: string): Promise<boolean> {
    const assignmentEvents = await this.blockchainEventModel
      .countDocuments({
        eventName: { $in: ['AssignTaskByAgent', 'AssignTaskByClient'] },
        taskId: taskId,
        status: EventProcessingStatus.PROCESSED,
      })
      .exec();

    return assignmentEvents > 0;
  }

  async resetFailedEvents(maxAttempts = 3): Promise<number> {
    const result = await this.blockchainEventModel
      .updateMany(
        {
          status: EventProcessingStatus.FAILED,
          processingAttempts: { $lt: maxAttempts },
        },
        {
          status: EventProcessingStatus.UNPROCESSED,
          $push: {
            statusHistory: {
              status: EventProcessingStatus.UNPROCESSED,
              timestamp: new Date(),
              message: 'Automatically reset for retry',
            },
          },
        },
      )
      .exec();

    return result.modifiedCount;
  }

  async getEventsByTaskId(taskId: string): Promise<BlockchainEventDocument[]> {
    return this.blockchainEventModel
      .find({ taskId })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .exec();
  }

  async getEventsByAgentAddress(agentAddress: string): Promise<BlockchainEventDocument[]> {
    return this.blockchainEventModel
      .find({ agentAddress })
      .sort({ blockNumber: 1, transactionIndex: 1, logIndex: 1 })
      .exec();
  }

  async getEventsByTransactionHash(transactionHash: string): Promise<BlockchainEventDocument[]> {
    return this.blockchainEventModel.find({ transactionHash }).sort({ logIndex: 1 }).exec();
  }

  async getProcessingStats() {
    const stats = await this.blockchainEventModel
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgAttempts: { $avg: '$processingAttempts' },
          },
        },
      ])
      .exec();

    return stats.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        avgAttempts: item.avgAttempts,
      };
      return acc;
    }, {});
  }

  async getEventChain(taskId: string): Promise<Record<string, BlockchainEventDocument>> {
    const events = await this.getEventsByTaskId(taskId);

    // Organize by event type for easy access to the processing chain
    return events.reduce((acc, event) => {
      acc[event.eventName] = event;
      return acc;
    }, {});
  }

  async deleteOldProcessedEvents(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.blockchainEventModel
      .deleteMany({
        status: EventProcessingStatus.PROCESSED,
        processedAt: { $lt: cutoffDate },
      })
      .exec();

    return result.deletedCount;
  }
}
