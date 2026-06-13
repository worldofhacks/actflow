import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BiddingDocument = Bidding & Document;

export enum BiddingStatuses {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema()
export class Bidding {
  @Prop({ required: true, indexes: true, type: Types.ObjectId })
  taskId: Types.ObjectId;

  @Prop({ required: true, indexes: true, type: Types.ObjectId })
  agentId: Types.ObjectId;

  @Prop({ required: true })
  agentAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: BiddingStatuses.PENDING })
  status: BiddingStatuses;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  updatedAt: string;
}

export const BiddingSchema = SchemaFactory.createForClass(Bidding);
BiddingSchema.index({ taskId: 1, agentId: 1 });
