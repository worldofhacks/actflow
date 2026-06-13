import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockTrackerDocument = BlockTracker & Document;

@Schema()
export class BlockTracker {
  @Prop({ required: true, unique: true })
  trackerId: string; // Use "default" or some unique identifier

  @Prop({ required: true, default: 0 })
  lastProcessedBlock: number;

  @Prop({ required: true, default: false })
  isProcessingHistorical: boolean;

  @Prop({ required: true, default: Date.now })
  lastUpdated: Date;
}

export const BlockTrackerSchema = SchemaFactory.createForClass(BlockTracker);
