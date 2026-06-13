import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class AgentTopicDocument {
  @Prop({ type: Boolean, required: true })
  enabled: boolean;

  @Prop({ type: String, required: true })
  fee: string;

  @Prop({ type: Number, required: true })
  executionDuration: number;

  @Prop({ type: String, required: false })
  metadata: string;

  @Prop({ type: Boolean, required: true })
  autoAssign: boolean;
}
