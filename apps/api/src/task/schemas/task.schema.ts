import { TaskState } from '../../contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { PopulatedAgentDocument } from '../../agents/schemas/agent.schema';
import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';
import { TaskMetadataDocument } from './task-metadata.schema';

export interface PopulatedTaskDocument
  extends Omit<TaskDocument, 'metadataId' | 'invitedAgentIds' | 'assignedAgentId'> {
  invitedAgents: PopulatedAgentDocument[];
  assignedAgent: PopulatedAgentDocument;
  metadata: TaskMetadataDocument;
}

@Schema()
export class TaskDocument extends Document {
  //------------------------------------------------------
  // Core Identification Fields
  //------------------------------------------------------
  @Prop({ required: true })
  taskId: string;

  // @Prop({ required: true, default: 'No context ID' })
  // contextId: string;

  @Prop({ required: false, default: 'No child IP ID' })
  childIpId: string;

  @Prop({ required: false, default: 'No child token ID' })
  childTokenId: string;

  //------------------------------------------------------
  // Blockchain Metadata
  //------------------------------------------------------
  @Prop({ required: false })
  createdTransaction: TransactionInfoDocument;

  //------------------------------------------------------
  // Task Parameters
  //------------------------------------------------------
  @Prop({ required: true, default: '0' })
  reward: string;

  @Prop({ required: false, default: 'No topic assigned' })
  topic: string;

  @Prop({
    type: Number,
    enum: Object.values(TaskState).filter(v => !isNaN(Number(v))),
    default: TaskState.PENDING,
  })
  state: TaskState;

  @Prop({ type: Number })
  executionDuration: number;

  @Prop({ type: Number })
  submissionDuration: number;

  @Prop({ required: true, default: 0 })
  updatedAtTs: number;

  @Prop({ required: true, default: 0 })
  createdAtTs: number;

  @Prop({ type: Date })
  expiredAt: Date;

  @Prop({ type: String, default: '0' })
  validationReward: string;

  @Prop({ type: String, default: '0' })
  assignedValidator: string;

  //------------------------------------------------------
  // Participants
  //------------------------------------------------------
  @Prop({ required: true, default: 'No creator assigned' })
  creator: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AgentDocument', required: false })
  assignedAgentId: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AgentDocument' }], required: false })
  invitedAgentIds: string[];

  //------------------------------------------------------
  // Task Payloads
  //------------------------------------------------------
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TaskMetadataDocument' })
  metadataId: string;

  @Prop({ type: String, required: false })
  resultData?: string;

  //------------------------------------------------------
  // Payment Unlock (x402 / World free-trial) — GAP 4
  //------------------------------------------------------

  /**
   * Whether this task has been UNLOCKED by a verified x402 payment or a consumed World ID
   * free trial. An unpaid task stays `false` and does not proceed; a paid/trial-unlocked
   * task is `true`. This is the binding marketplace-side decision tied to the receipt below.
   */
  @Prop({ type: Boolean, default: false, required: false })
  unlocked: boolean;

  /** How the task was unlocked: 'x402' (paid) or 'world-trial' (free trial). */
  @Prop({ type: String, required: false })
  unlockMethod?: 'x402' | 'world-trial';

  /** Whether the unlock was a labeled MOCK (no real on-chain settlement). */
  @Prop({ type: Boolean, required: false })
  unlockMock?: boolean;

  /** Mongo id of the PaymentReceipt that unlocked this task (audit tie-back). */
  @Prop({ type: String, required: false })
  unlockReceiptId?: string;

  /** When the task was unlocked. */
  @Prop({ type: Date, required: false })
  unlockedAt?: Date;

  //------------------------------------------------------
  // Task Lifecycle Events
  //------------------------------------------------------
  @Prop({ type: Date })
  pendingAt: Date;

  @Prop({ type: Date })
  inviteAt: Date;

  @Prop({ type: Date })
  assignedAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Date })
  submittedAt: Date;

  @Prop({ type: Date })
  validatedAt: Date;

  @Prop({ type: Date })
  declinedByOwnerAt: Date;

  @Prop({ type: Date })
  declinedByValidatorAt: Date;

  @Prop({ type: Date })
  disputedByOwnerAt: Date;

  @Prop({ type: Date })
  disputedByAgentAt: Date;

  @Prop({ type: Date })
  resolvedAt: Date;

  //------------------------------------------------------
  // Dispute & Resolution Data
  //------------------------------------------------------
  @Prop({ type: String })
  disputeReason: string;

  @Prop({ type: String })
  clientAmount: string;

  @Prop({ type: String })
  agentAmount: string;

  //------------------------------------------------------
  //  Blockchain Metadata
  //------------------------------------------------------

  @Prop({ type: Boolean, default: false, required: false })
  isBlockchainConfirmed: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isMetadataDefault: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isDeleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(TaskDocument);

// Add indexes for efficient querying
TaskSchema.index({ taskId: 1 }, { unique: true });
TaskSchema.index({ creator: 1 });
TaskSchema.index({ assignedAgent: 1 });
TaskSchema.index({ state: 1 });
TaskSchema.index({ topic: 1 });
TaskSchema.index({ invitedAgents: 1 });
