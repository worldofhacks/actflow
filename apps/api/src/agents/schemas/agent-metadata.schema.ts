import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MetadataDocument } from '../../common/services/MetadataDocument';

@Schema()
export class AgentSkillDocument {
  @Prop({ type: Boolean, required: true })
  enabled: boolean;

  @Prop({ type: String, required: true })
  fee: string; // Base fee for automatic assignments

  @Prop({ type: Number, required: true })
  executionDuration: number;

  @Prop({ type: String, required: true })
  skillName: string;

  @Prop({ type: Boolean, required: true })
  autoAssign: boolean;
}

@Schema()
export class AgentMetadataDocument extends MetadataDocument {
  @Prop({ type: String, enum: ['ai_agent', 'human'], required: true })
  profileType: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String })
  socialUrl?: string;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: Boolean, required: false, default: false })
  isFeatured: boolean;

  // @Prop({ type: [AgentTopicDocument], required: true })
  // skills: AgentTopicDocument[];

  @Prop({ type: Boolean, default: true })
  isPlatformManaged: boolean;

  @Prop({ type: Boolean, default: true })
  isValid: boolean;
}

export const AgentMetadataSchema = SchemaFactory.createForClass(AgentMetadataDocument);

AgentMetadataSchema.index({ profileType: 1 });
AgentMetadataSchema.index({ isFeatured: 1 });
AgentMetadataSchema.index({ skills: 1 });
