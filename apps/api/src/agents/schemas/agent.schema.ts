import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { PopulatedTaskDocument } from '../../task/schemas/task.schema';
import { AgentMetadata } from '../core/agent-metadata';
import { AgentAnalyticsDocument, AgentAnalyticsSchema } from './agent-analytics.schema';
import { AgentSkillDocument } from './agent-metadata.schema';
import { AgentStatisticsDocument, AgentStatisticsSchema } from './agent-statistics.schema';
import { TransactionInfoDocument } from './transaction-info.schema';

export interface PopulatedAgentDocument
  extends Omit<
    AgentDocument,
    'invitedTaskIds' | 'assignedTaskIds' | 'completedTaskIds' | 'metadataId'
  > {
  invitedTasks: PopulatedTaskDocument[];
  assignedTasks: PopulatedTaskDocument[];
  completedTasks: PopulatedTaskDocument[];
  metadata: AgentMetadata; //Here should be agentmetadata document
}

@Schema()
export class AgentDocument extends Document {
  //------------------------------------------------------
  // Core Identification
  //------------------------------------------------------
  @Prop({ type: String, required: true })
  agentId: string;

  @Prop({ type: String, required: false, default: 'No IP Asset ID' })
  ipAssetId: string;

  @Prop({ type: String, required: false, default: 'No NFT Token ID' })
  canNftTokenId: string;

  @Prop({ type: String, required: false, default: 'No License Terms ID' })
  licenseTermsId: string;

  //------------------------------------------------------
  // Agent Parameters
  //------------------------------------------------------

  @Prop({ type: String, required: true })
  topic: string;

  @Prop({ type: [AgentSkillDocument], required: true })
  skills: AgentSkillDocument[];

  @Prop({ type: Boolean, default: false, required: false })
  isPaused: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isDeleted: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isFeatured: boolean;

  /**
   * Reference to the metadata document in the AgentMetadata collection
   */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AgentMetadataDocument' })
  metadataId: string;

  //------------------------------------------------------
  // Task Relationships
  //------------------------------------------------------
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskDocument' }],
    default: [],
    required: false,
  })
  invitedTaskIds: string[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskDocument' }],
    default: [],
    required: false,
  })
  assignedTaskIds: string[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskDocument' }],
    default: [],
    required: false,
  })
  completedTaskIds: string[];

  //------------------------------------------------------
  // Performance Statistics
  //------------------------------------------------------
  @Prop({ type: AgentStatisticsSchema, required: false })
  statistics?: AgentStatisticsDocument;

  //------------------------------------------------------
  // Agent Analytics
  //------------------------------------------------------
  @Prop({ type: AgentAnalyticsSchema, required: false })
  analytics?: AgentAnalyticsDocument;
  //------------------------------------------------------
  // Blockchain Metadata
  //------------------------------------------------------
  @Prop({ type: TransactionInfoDocument, required: false })
  creationTransaction: TransactionInfoDocument;

  //------------------------------------------------------
  // Agent Settings
  //------------------------------------------------------

  @Prop({ type: Boolean, default: false, required: false })
  isBlockchainConfirmed: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isMetadataDefault: boolean;
}

export const AgentSchema = SchemaFactory.createForClass(AgentDocument);

AgentSchema.index({ agentId: 1 }, { unique: true });

// AgentSchema.index({ metadataId: 1 });
// AgentSchema.index({ topics: 1 });
// AgentSchema.index({ invitedTaskIds: 1 });
// AgentSchema.index({ assignedTaskIds: 1 });
// AgentSchema.index({ completedTaskIds: 1 });
// AgentSchema.index({ 'metadata.profileType': 1 });
// AgentSchema.index({ 'metadata.isFeatured': 1 });
// AgentSchema.index({ 'socialAnalytics.platform': 1 });
// AgentSchema.index({ 'socialAnalytics.followers': -1 });
// AgentSchema.index({ 'socialAnalytics.engagementRate': -1 });
