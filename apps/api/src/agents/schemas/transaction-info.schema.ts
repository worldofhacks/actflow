import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class TransactionInfoDocument {
  @Prop({ required: true })
  blockNumber: number;

  @Prop({ required: true })
  transactionHash: string;

  @Prop({ required: false })
  transactionIndex: number;

  @Prop({ required: false })
  logIndex: number;

  @Prop({ required: false })
  processedAt: Date;
}
