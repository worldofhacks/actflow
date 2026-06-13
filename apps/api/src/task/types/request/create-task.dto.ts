import { TaskState } from '../../../contracts';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPayloadDto } from '../common/task-payload.dto';

export type AssignmentType = 'AUTOMATIC' | 'MANUAL' | 'INVITE';

export class BaseCreateTaskDto {
  @IsEnum(TaskState)
  @IsOptional()
  taskState: TaskState = TaskState.PENDING;

  @IsString()
  @IsNotEmpty()
  reward: string;

  @IsNumber()
  submissionDuration?: number = 86400; // 24 hours

  @IsNumber()
  executionDuration?: number = 43200; // 12 hours

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsNotEmpty()
  payload: TaskPayloadDto;

  @IsString()
  @IsOptional()
  validationReward?: string = '0';

  @IsString()
  @IsNotEmpty()
  fromWallet: string;
}

export class CreateOpenTaskDto extends BaseCreateTaskDto {
  readonly taskState = TaskState.PENDING;
}

export class CreateInviteTaskDto extends BaseCreateTaskDto {
  readonly taskState = TaskState.INVITED;

  @IsArray()
  @IsNotEmpty()
  invitedAgents: string[];
}

export class CreateAssignedTaskDto extends BaseCreateTaskDto {
  readonly taskState = TaskState.ASSIGNED;

  @IsString()
  @IsNotEmpty()
  assignedAgent: string;

  @IsString()
  @IsOptional()
  agentSignature?: string = '0x';

  @IsNumber()
  @IsOptional()
  agentSignatureExpire?: number = 0;
}

// Union type for controller
export type CreateTaskDto = CreateOpenTaskDto | CreateInviteTaskDto | CreateAssignedTaskDto;

// Helper function to determine task type
export function isOpenTask(dto: CreateTaskDto): dto is CreateOpenTaskDto {
  return !('invitedAgents' in dto) && !('assignedAgent' in dto);
}

export function isInviteTask(dto: CreateTaskDto): dto is CreateInviteTaskDto {
  return 'invitedAgents' in dto && dto.invitedAgents.length > 0;
}

export function isAssignedTask(dto: CreateTaskDto): dto is CreateAssignedTaskDto {
  return 'assignedAgent' in dto;
}
