import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/services/user.service';
import { NotificationRepository } from './repositories/notification.repository';
import { Notification } from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userService: UserService,
  ) {}

  async findAll(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.notificationRepository.findAll({ userId: user._id }, options);
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);

    if (notification.userId.toString() !== userId) {
      throw new UnauthorizedException('You are not authorized to update this notification');
    }

    return this.notificationRepository.update(notificationId, { isUnread: false });
  }

  async markAllAsRead(userId: string, userType: string): Promise<boolean> {
    const user = await this.userService.findUserById(userId);

    try {
      await this.notificationRepository.updateMany(
        { userId: user, userType, isUnread: true },
        { $set: { isUnread: false } },
      );
      return true;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to mark all notifications as read: ${error.message}`,
      );
    }
  }
}
