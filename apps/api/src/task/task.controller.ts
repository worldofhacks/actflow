import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ContractConfigService } from '../config/service/contract.config.service';
import { FacadeTaskService } from '../domain/task/facade.task.service';
import { User } from '../user/decorators/user.decorator';
import { TaskService } from './services/task.service';
import { TaskMapper } from './task.mapper';
import { AcceptTaskDto } from './types/request/accept-task.dto';
import { AssignTaskDto } from './types/request/assign-task.dto';
import { CloseTasksDto } from './types/request/close-task.dto';
import { CreateTaskDto } from './types/request/create-task.dto';
import { DisputeTaskDto } from './types/request/dispute-task.dto';
import { SubmitResultDto } from './types/request/submit-task-result.dto';
import { TaskFilterDto } from './types/request/task-filter.dto';
import { ValidateTaskDto } from './types/request/validate-task.dto';
import { AssignTaskResponse } from './types/response/assign-task.response';
import { CloseTasksResponse } from './types/response/close-task.response';
import { CreateTaskResponse } from './types/response/create-task.response';
import { TaskDetailsApiResponse } from './types/response/task-details.response';
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly facadeService: FacadeTaskService,
    private readonly contractConfigService: ContractConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-task')
  async createTask(
    @User() user: any,
    @Body() taskData: CreateTaskDto,
  ): Promise<CreateTaskResponse> {
    return this.facadeService.registerTask(user._id, taskData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign-task')
  async assignTask(
    @User() user: any,
    @Body() assignTaskData: AssignTaskDto,
  ): Promise<AssignTaskResponse> {
    return this.facadeService.assignTask(user._id, assignTaskData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('close-tasks')
  async closeTasks(
    @User() user: any,
    @Body() closeTasksData: CloseTasksDto,
  ): Promise<CloseTasksResponse> {
    return this.facadeService.closeTasks(user._id, closeTasksData);
  }

  @Get(':taskId')
  async getTaskById(@Param('taskId') taskId: string): Promise<TaskDetailsApiResponse> {
    const task = await this.taskService.getTaskByTaskId(taskId);

    const config = await this.contractConfigService.getLatestConfig();
    return TaskMapper.toTaskDetailsWithTimeframes(
      task,
      config.serviceDelay,
      config.validationDelay,
    );
  }

  @Post('search')
  async searchTasks(@Body() filterDto: TaskFilterDto): Promise<TaskDetailsApiResponse[]> {
    const tasks = await this.taskService.searchTasks(filterDto);
    return tasks.map(task => TaskMapper.toTaskDetails(task));
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept-task')
  async acceptTask(@User() user: any, @Body() acceptTaskData: AcceptTaskDto) {
    return this.facadeService.acceptTask(user._id, acceptTaskData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('dispute-task')
  async disputeTask(@User() user: any, @Body() disputeTaskData: DisputeTaskDto): Promise<any> {
    return this.facadeService.disputeTask(user._id, disputeTaskData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate-task')
  async validateTask(@User() user: any, @Body() validateTaskData: ValidateTaskDto): Promise<any> {
    return this.facadeService.validateTask(user._id, validateTaskData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit-result')
  async submitResult(@User() user: any, @Body() submitResultData: SubmitResultDto): Promise<any> {
    return this.facadeService.submitTaskResult(user._id, submitResultData);
  }
}
