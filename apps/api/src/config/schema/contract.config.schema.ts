// config/schema/contract.config.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContractConfigDocument = ContractConfig & Document;

@Schema({ timestamps: true })
export class ContractConfig {
  //------------------------------------------------------
  // Core Configuration Fields
  //------------------------------------------------------
  @Prop({ required: true, type: Number })
  serviceDelay: number;

  @Prop({ required: true, type: Number })
  validationDelay: number;

  @Prop({ required: true, type: Number })
  validatorStakeDuration: number;

  @Prop({ required: true, type: String })
  validatorStakeAmount: string;

  @Prop({ required: true, type: Number })
  serviceFee: number;

  @Prop({ required: true, type: Number, default: 1000 })
  feeBasis: number;

  //------------------------------------------------------
  // Metadata Fields
  //------------------------------------------------------
  @Prop({ required: true, type: Number })
  blockNumber: number;

  @Prop({ required: true, type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ required: false, type: String })
  transactionHash: string;
}

export const ContractConfigSchema = SchemaFactory.createForClass(ContractConfig);
