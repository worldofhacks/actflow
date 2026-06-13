// task-scheduler.service.ts
import { TaskState } from '../contracts';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventHandlerService } from '../domain/common/handler.service';
import { TaskService } from '../task/services/task.service';
import { TaskFilterDto } from '../task/types/request/task-filter.dto';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);
  private readonly serviceDelay: number = 86400; // 24 hours in seconds - get from config

  constructor(
    private readonly taskService: TaskService,
    private readonly eventHandlerService: EventHandlerService,
  ) {}

  @Cron('0 * * * * *') // Run every minute
  async checkTaskTimelines() {
    this.logger.log('Running scheduled task state checks');
    const now = Math.floor(Date.now() / 1000);

    await this.handleExpiredAssignedTasks(now);
    // await this.handleAutoCompleteTasks(now);
  }

  private async handleExpiredAssignedTasks(currentTime: number) {
    const assignedFilter = new TaskFilterDto();
    assignedFilter.state = TaskState.ASSIGNED;
    const assignedTasks = await this.taskService.searchTasks(assignedFilter);

    for (const task of assignedTasks) {
      if (currentTime > task.updatedAtTs + task.executionDuration) {
        this.logger.log(`Task ${task.taskId} has expired`);
        await this.eventHandlerService.expireTask(
          task.taskId,
          task.assignedAgent.agentId,
          task.creator,
        );
      }
      //abo task.updatedAtTs + serviceDelay
    }
  }

  private async handleAutoCompleteTasks(currentTime: number) {
    const submittedFilter = new TaskFilterDto();
    submittedFilter.state = TaskState.SUBMITTED;
    const submittedTasks = await this.taskService.searchTasks(submittedFilter);

    for (const task of submittedTasks) {
      if (currentTime > task.updatedAtTs + this.serviceDelay) {
        this.logger.log(`Auto-completing task ${task.taskId}`);
        await this.eventHandlerService.completeTask(task.taskId);
      }
    }
  }
}
