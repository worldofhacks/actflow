import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from '../user/decorators/user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@User() user) {
    return this.notificationService.findAll(user._id);
  }

  @Patch(':id/read')
  markAsRead(@User() user, @Param('id') id: string) {
    return this.notificationService.markAsRead(user._id, id);
  }

  @Patch('read-all')
  markAllAsRead(@User() user, @Query('userType') userType: string) {
    return this.notificationService.markAllAsRead(user._id, userType);
  }
}
