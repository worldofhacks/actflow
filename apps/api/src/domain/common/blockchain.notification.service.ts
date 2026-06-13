import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../../notification/repositories/notification.repository';
import { NotificationType, UserType } from '../../notification/schemas/notification.schema';
import { UserService } from '../../user/services/user.service';

// Define interfaces for notification creation
interface NotificationData {
  userType?: UserType;
  type: NotificationType;
  message: string;
  entityId: string;
}

interface UserNotificationParams {
  address: string;
  userType?: UserType;
  data: NotificationData;
}

@Injectable()
export class BlockchainNotificationService {
  private readonly logger = new Logger(BlockchainNotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userService: UserService,
  ) {}

  // Core notification method to reduce duplication
  private async createNotificationForUser({
    address,
    userType,
    data,
  }: UserNotificationParams): Promise<void> {
    try {
      const user = await this.userService.findUserByAddress(address);
      if (!user) return;

      await this.notificationRepository.create({
        userId: user,
        userType: userType || data.userType || UserType.CLIENT,
        type: data.type,
        message: data.message,
        entityId: data.entityId,
      });
    } catch (error) {
      this.logger.error(`Failed to create ${data.type} notification: ${error.message}`);
    }
  }

  // Helper method for dual notifications (client and agent)
  private async createDualNotifications(
    clientAddress: string,
    agentAddress: string,
    clientData: NotificationData,
    agentData: NotificationData,
  ): Promise<void> {
    try {
      await Promise.all([
        this.createNotificationForUser({
          address: clientAddress,
          userType: UserType.CLIENT,
          data: clientData,
        }),
        this.createNotificationForUser({
          address: agentAddress,
          userType: UserType.AGENT,
          data: agentData,
        }),
      ]);
    } catch (error) {
      this.logger.error(`Failed to create dual notifications: ${error.message}`);
    }
  }

  // Task notifications
  async notifyTaskCreated(address: string, taskId: string): Promise<void> {
    await this.createNotificationForUser({
      address,
      userType: UserType.CLIENT,
      data: {
        type: NotificationType.TASK_CREATED,
        message: 'Your task has been created successfully.',
        entityId: taskId,
      },
    });
  }

  async notifyTaskAssigned(
    clientAddress: string,
    agentAddress: string,
    taskId: string,
  ): Promise<void> {
    await this.createDualNotifications(
      clientAddress,
      agentAddress,
      {
        type: NotificationType.TASK_ASSIGNED,
        message: 'Your task has been assigned to an agent.',
        entityId: taskId,
      },
      {
        type: NotificationType.TASK_ASSIGNED,
        message: 'You have been assigned a new task.',
        entityId: taskId,
      },
    );
  }

  async notifyTaskSubmitted(
    clientAddress: string,
    agentAddress: string,
    taskId: string,
  ): Promise<void> {
    await this.createDualNotifications(
      clientAddress,
      agentAddress,
      {
        type: NotificationType.TASK_SUBMITTED,
        message: 'Your task has been submitted and is ready for review.',
        entityId: taskId,
      },
      {
        type: NotificationType.TASK_SUBMITTED,
        message: 'You have successfully submitted a task.',
        entityId: taskId,
      },
    );
  }

  async notifyTaskCompleted(
    clientAddress: string,
    agentAddress: string,
    taskMongoId: string,
  ): Promise<void> {
    await this.createDualNotifications(
      clientAddress,
      agentAddress,
      {
        type: NotificationType.TASK_COMPLETED,
        message: 'Your task has been completed.',
        entityId: taskMongoId,
      },
      {
        type: NotificationType.TASK_COMPLETED,
        message: 'A task you worked on has been completed.',
        entityId: taskMongoId,
      },
    );
  }

  async notifyTaskDisputed(
    recipientAddress: string,
    taskId: string,
    reason: string,
    disputedBy: 'owner' | 'agent',
  ): Promise<void> {
    const isOwnerDispute = disputedBy === 'owner';

    await this.createNotificationForUser({
      address: recipientAddress,
      userType: isOwnerDispute ? UserType.AGENT : UserType.CLIENT,
      data: {
        type: NotificationType.TASK_DISPUTED,
        message: isOwnerDispute
          ? `A client has disputed task #${taskId}. Reason: ${reason}`
          : `An agent has disputed task #${taskId}. Reason: ${reason}`,
        entityId: taskId,
      },
    });
  }

  async notifyAgentCreated(address: string): Promise<void> {
    await this.createNotificationForUser({
      address,
      userType: UserType.AGENT,
      data: {
        type: NotificationType.AGENT_CREATED,
        message: 'Your agent has been successfully registered.',
        entityId: address,
      },
    });
  }

  async notifyAgentInvited(agentAddress: string, taskId: string): Promise<void> {
    await this.createNotificationForUser({
      address: agentAddress,
      userType: UserType.AGENT,
      data: {
        type: NotificationType.AGENT_INVITED,
        message: 'Your agent has been invited to a task.',
        entityId: taskId,
      },
    });
  }

  async notifyTaskExpired(
    walletAddress: string,
    agentId: string,
    taskMongoId: string,
  ): Promise<void> {
    await this.createDualNotifications(
      walletAddress,
      agentId,
      {
        type: NotificationType.TASK_EXPIRED,
        message: `Task #${taskMongoId} has expired as the agent did not submit it in time.`,
        entityId: taskMongoId,
      },
      {
        type: NotificationType.TASK_EXPIRED,
        message: `Your assigned task #${taskMongoId} has expired as it was not submitted in time.`,
        entityId: taskMongoId,
      },
    );
  }

  async notifyTaskValidated(
    recipientAddress: string,
    taskId: string,
    validatedBy: 'validator' | 'owner',
    taskCreator: string,
  ): Promise<void> {
    await this.createNotificationForUser({
      address: recipientAddress,
      userType: recipientAddress === taskCreator ? UserType.CLIENT : UserType.AGENT,
      data: {
        type: NotificationType.TASK_VALIDATED,
        message: `Task #${taskId} has been validated by a validator.`,
        entityId: taskId,
      },
    });
  }

  async notifyTaskDeclined(
    recipientAddress: string,
    taskId: string,
    reason: string,
    declinedBy: 'owner' | 'validator',
  ): Promise<void> {
    const userType =
      declinedBy === 'owner'
        ? UserType.AGENT
        : declinedBy === 'validator'
          ? UserType.CLIENT
          : UserType.AGENT;

    let message = '';
    if (declinedBy === 'owner') {
      message = `Task #${taskId} has been declined by the client. Reason: ${reason}`;
    } else {
      message = `Task #${taskId} has been declined by a validator. Reason: ${reason}`;
    }

    await this.createNotificationForUser({
      address: recipientAddress,
      userType: userType,
      data: {
        type: NotificationType.TASK_DECLINED,
        message: message,
        entityId: taskId,
      },
    });
  }
}
