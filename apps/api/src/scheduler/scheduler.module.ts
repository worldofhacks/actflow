// scheduler.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentModule } from '../agents/agent.module';
import { DomainModule } from '../domain/domain.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { NotificationModule } from '../notification/notification.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { TaskSchedulerService } from './task-state.job';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    UserModule,
    MarketplaceModule,
    TaskModule,
    AgentModule,
    NotificationModule,
    DomainModule,
  ],
  providers: [TaskSchedulerService],
  exports: [TaskSchedulerService],
})
export class SchedulerModule {}
