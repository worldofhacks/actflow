import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class AgentStatisticsDocument {
  @Prop({ required: true, default: '0' })
  totalTasksCompleted: number;

  @Prop({ required: true, default: '0' })
  totalEarnings: string;

  @Prop({ required: true, default: 0 })
  automaticTasksCompleted: number;

  @Prop({ required: true, default: 0 })
  manualTasksCompleted: number;

  @Prop({ required: true, default: 0 })
  averageRating: number;

  @Prop({ required: true, default: 0 })
  totalRatings: number;

  @Prop({ required: true, default: 100 })
  successRate: number;

  @Prop({ required: true, default: 0 })
  averageCompletionTime: number;

  @Prop({ required: true, default: () => Date.now().toString() })
  lastActiveTimestamp: string;

  static Default: AgentStatisticsDocument = {
    totalTasksCompleted: 0,
    totalEarnings: '0',
    automaticTasksCompleted: 0,
    manualTasksCompleted: 0,
    averageRating: 0,
    totalRatings: 0,
    successRate: 100,
    averageCompletionTime: 0,
    lastActiveTimestamp: Date.now().toString(),
  };
}

export const AgentStatisticsSchema = SchemaFactory.createForClass(AgentStatisticsDocument);
