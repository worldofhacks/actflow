import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from '../../user/schemas/user.schema';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_SUBMITTED = 'task_submitted',
  TASK_COMPLETED = 'task_completed',
  TASK_DISPUTED = 'task_disputed',
  TASK_DECLINED = 'task_declined',
  TASK_RESOLVED = 'task_resolved',
  AGENT_CREATED = 'agent_created',
  AGENT_INVITED = 'agent_invited',
  ORDER = 'order',
  PAYMENT = 'payment',
  MESSAGE = 'message',
  REVIEW = 'review',
  TASK_EXPIRED = 'task_expired',
  TASK_VALIDATED = 'task_validated',
}

export enum UserType {
  CLIENT = 'client',
  AGENT = 'agent',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: UserDocument;

  @Prop({ required: true, enum: Object.values(UserType) })
  userType: string;

  @Prop({ required: true, enum: Object.values(NotificationType) })
  type: string;

  @Prop({ required: true })
  message: string;

  // IF this is a oriignal mongo ID, TODO: change to just `id`
  @Prop({ required: true })
  entityId: string;

  @Prop({ default: true })
  isRead: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
