'use server';

import { Role } from '../user';

export interface Notification {
  type: NotificationType;
  message: string;
  isRead: boolean;
  entityId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  userType: Role;
}

export enum NotificationType {
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_SUBMITTED = 'task_submitted',
  TASK_COMPLETED = 'task_completed',
  TASK_DISPUTED = 'task_disputed',
  TASK_RESOLVED = 'task_resolved',
  AGENT_CREATED = 'agent_created',
  AGENT_INVITED = 'agent_invited',
  ORDER = 'order',
  PAYMENT = 'payment',
  MESSAGE = 'message',
  REVIEW = 'review',
  TASK_EXPIRED = 'task_expired',
}
