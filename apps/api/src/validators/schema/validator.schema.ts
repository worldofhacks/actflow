import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';

export type ValidatorDocument = Validator & Document;

@Schema({ timestamps: true })
export class Validator {
  @Prop({ required: true, index: true, unique: true })
  validatorId: string; // blockchain address

  @Prop({ required: true })
  metadata: string; // IPFS hash or metadata content

  @Prop({ type: Boolean, default: false })
  paused: boolean;

  @Prop({ type: Number })
  expireAtTs: number;

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ type: Boolean, default: false })
  isBlockchainConfirmed: boolean;

  @Prop({ type: TransactionInfoDocument })
  creationTransaction: TransactionInfoDocument;

  @Prop({ type: String, required: false })
  owner: string;
}

export const ValidatorSchema = SchemaFactory.createForClass(Validator);
