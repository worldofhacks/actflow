import { MarketplaceEvent } from '../../contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockchainEventDocument = BlockchainEvent & Document;

export enum EventProcessingStatus {
  UNPROCESSED = 'unprocessed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  QUEUED = 'queued',
  PROCESSED = 'processed',
  WAITING = 'waiting',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}
export interface ProcessingError {
  timestamp: Date;
  message: string;
  stack?: string;
}

export interface WaitingDependency {
  eventName: string;
  field: string;
  value: string;
}

@Schema({ timestamps: true })
export class BlockchainEvent {
  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  eventName: string; // Using the event name directly from the contract

  @Prop({ required: true })
  blockNumber: number;

  @Prop({ required: true })
  transactionIndex: number;

  @Prop({ required: true })
  logIndex: number;

  @Prop({ required: true })
  transactionHash: string;

  // Store the parsed event data using your contract event types
  @Prop({ type: Object, required: true })
  eventData: Partial<MarketplaceEvent>; // This allows any of your event types

  // Processing metadata
  @Prop({ required: true, default: EventProcessingStatus.UNPROCESSED })
  status: EventProcessingStatus;

  @Prop({ required: true, default: 0 })
  processingAttempts: number;

  @Prop()
  lastProcessingAttempt: Date;

  @Prop()
  errorMessage: string;

  @Prop()
  processedAt: Date;

  // New comprehensive error tracking
  @Prop({ type: Array, default: [] })
  errorList: ProcessingError[];

  // Status history tracking
  @Prop({ type: Array, default: [] })
  statusHistory: {
    status: EventProcessingStatus;
    timestamp: Date;
    message?: string;
  }[];

  @Prop({ type: Date })
  queuedAt: Date;

  @Prop({ type: Date })
  waitingSince: Date;

  @Prop({ type: Object })
  waitingFor?: WaitingDependency;

  // Helper properties for common queries - extracted from eventData
  // These would be populated when saving the event
  @Prop()
  taskId?: string;

  @Prop()
  taskOwner?: string;

  @Prop()
  agentAddress?: string;

  @Prop({ default: 0 })
  waitingRetryCount: number;

  @Prop({ type: Object })
  waitingDependency?: WaitingDependency;

  @Prop()
  nextRetryAt: Date;
}

export const BlockchainEventSchema = SchemaFactory.createForClass(BlockchainEvent);

// Add indexes for efficient querying
BlockchainEventSchema.index({ status: 1, blockNumber: 1, transactionIndex: 1, logIndex: 1 });
BlockchainEventSchema.index({ eventName: 1, status: 1 });
BlockchainEventSchema.index({ taskId: 1 });
BlockchainEventSchema.index({ agentAddress: 1 });
BlockchainEventSchema.index({ 'statusHistory.status': 1, 'statusHistory.timestamp': -1 });
BlockchainEventSchema.index({ waitingSince: 1 });
