import { MarketLibTask, TaskState } from '../contracts';
import { AgentMapper } from '../agents/mappers/agent.mapper';
import { DEFAULT_BLOCK_NUMBER, DEFAULT_FEEDBACK, DEFAULT_RATING } from '../core/types/constants';
import { TaskDomainModel } from './domain/task';
import { TaskMetadata } from './domain/task-metadata';
import { PopulatedTaskDocument, TaskDocument } from './schemas/task.schema';
import { TaskMetadataMapper } from './task-metadata.mapper';
import {
  TaskDetailsApiResponse,
  TaskSummaryApiResponse,
} from './types/response/task-details.response';
import { CreateTaskServiceDto } from './types/services/create-task.dto';

export class TaskMapper {
  static toSummaryView(task: TaskDomainModel): TaskSummaryApiResponse {
    const skillName = AgentMapper.extractSkillNameFromSkill(task.topic);
    return {
      taskId: task.taskId,
      reward: task.reward,
      topic: skillName,
      state: task.state,
      creator: task.creator,
      assignedAgent: task.assignedAgent ? AgentMapper.toDetailedView(task.assignedAgent) : null,
      childIpId: task.childIpId,
      childTokenId: task.childTokenId,
      blockNumber: DEFAULT_BLOCK_NUMBER, //TODO: use mock for now
      metadata: TaskMetadataMapper.mapToApiResponse(task.metadata),
      isBlockchainConfirmed: task.isBlockchainConfirmed,
    };
  }

  static toTaskDetailsWithTimeframes(
    taskObject: TaskDomainModel,
    serviceDelay: number,
    validationDelay: number,
  ): TaskDetailsApiResponse {
    return {
      ...this.toTaskDetails(taskObject),
      serviceExpiresAt: taskObject.submittedAtTs
        ? new Date(taskObject.submittedAtTs + serviceDelay)
        : undefined,
      validationDelayExpiresAt: taskObject.submittedAtTs
        ? new Date(taskObject.submittedAtTs + validationDelay)
        : undefined,
    };
  }

  static toTaskDetails(taskObject: TaskDomainModel): TaskDetailsApiResponse {
    return {
      taskId: taskObject.taskId,
      reward: taskObject.reward,
      topic: taskObject.topic,
      state: taskObject.state,
      creator: taskObject.creator,
      assignedAgent: taskObject.assignedAgent ? taskObject.assignedAgent.agentId : null,
      invitedAgents: taskObject?.invitedAgents?.length
        ? taskObject.invitedAgents.map(agent => AgentMapper.toDetailedView(agent))
        : [],
      assignedValidator: taskObject.assignedValidator,
      validationReward: taskObject.validationReward,
      childIpId: taskObject.childIpId,
      childTokenId: taskObject.childTokenId,
      executionDuration: taskObject.executionDuration,
      submissionDuration: taskObject.submissionDuration,
      createdAtTs: taskObject.createdAtTs,
      updatedAtTs: taskObject.updatedAtTs,

      metadata: TaskMetadataMapper.mapToApiResponse(taskObject.metadata),

      resultData: taskObject.result,

      blockNumber: DEFAULT_BLOCK_NUMBER,
      rating: DEFAULT_RATING,
      feedback: DEFAULT_FEEDBACK,

      expiredAt: new Date(taskObject.createdAtTs + taskObject.executionDuration), //TODO: TEST THIS LOGIC

      submissionExpiresAt: new Date(taskObject.createdAtTs + taskObject.executionDuration),
      assigningExpiresAt: new Date(taskObject.createdAtTs + taskObject.submissionDuration),

      // serviceExpiresAt: new Date(taskObject.createdAtTs + taskObject.executionDuration),
      // validationExpiresAt: new Date(taskObject.createdAtTs + taskObject.executionDuration),

      transactions: taskObject.relatedTransactions,
      isBlockchainConfirmed: taskObject.isBlockchainConfirmed,
    };
  }

  // Create pending task (after contract call but before confirmation)
  static createPending(data: CreateTaskServiceDto, metadata: TaskMetadata): TaskDomainModel {
    return new TaskDomainModel(
      '',
      data.taskId,
      data.creator,
      data.assignedAgentId
        ? TaskState.ASSIGNED
        : data.invitedAgentIds?.length
          ? TaskState.INVITED
          : TaskState.PENDING,
      data.topic,
      data.reward,
      data.executionDuration,
      data.submissionDuration,
      Math.floor(Date.now() / 1000), // updatedAtTs
      Math.floor(Date.now() / 1000), // createdAtTs
      undefined, // submittedAtTs
      metadata,
      false, // isBlockchainConfirmed
      false, // isDeleted
      false, // isMetadataDefault
      undefined, // childIpId
      undefined, // childTokenId
      undefined, // result
      undefined,
      undefined,
      undefined,
      data.validationReward,
      undefined, //tx
    );
  }

  static fromContract(contractData: MarketLibTask, metadata: TaskMetadata): TaskDomainModel {
    return new TaskDomainModel(
      '',
      contractData.id.toString(),
      contractData.owner,
      Number(contractData.state),
      contractData.topic,
      contractData.reward.toString(),
      Number(contractData.executionDuration),
      Number(contractData.submissionDuration),
      Number(contractData.updatedAtTs),
      Number(contractData.createdAtTs || contractData.updatedAtTs),
      undefined,
      metadata,
      true, // isBlockchainConfirmed
      false, // isMetadataDefault
      false, //isDeleted
      contractData.childIpId?.toString(),
      contractData.childTokenId?.toString(),
      undefined, // result
      undefined, //assignedAgent
      undefined,
      contractData.validator,
      contractData.validationReward.toString(),
      undefined,
    );
  }

  static minimumTaskToDb(task: TaskDomainModel): Partial<TaskDocument> {
    return {
      taskId: task.taskId,
      metadataId: task.metadata.id,
      creator: task.creator,
      reward: task.reward,
      topic: task.topic,
      state: task.state,
      executionDuration: task.executionDuration,
      submissionDuration: task.submissionDuration,
      isBlockchainConfirmed: task.isBlockchainConfirmed,
      isMetadataDefault: task.isMetadataDefault,
      isDeleted: task.isDeleted,
      childIpId: task.childIpId,
      childTokenId: task.childTokenId,
      assignedAgentId: task?.assignedAgent?.mongoId,
      validationReward: task.validationReward,
      assignedValidator: task?.assignedValidator,
      updatedAtTs: task.updatedAtTs,
      createdAtTs: task.createdAtTs,
    };
  }

  static fromPopulatedDocument(document: PopulatedTaskDocument): TaskDomainModel {
    const assignedAgent = document.assignedAgent
      ? AgentMapper.fromDocument(document.assignedAgent, true)
      : null;

    const invitedAgents =
      document?.invitedAgents && document?.invitedAgents.length > 0
        ? document?.invitedAgents?.map(agent => AgentMapper.fromDocument(agent, true))
        : [];

    const task = new TaskDomainModel(
      document._id.toString(),
      document.taskId,
      document.creator,
      document.state,
      document.topic,
      document.reward,
      document.executionDuration,
      document.submissionDuration,
      document.updatedAtTs,
      document.createdAtTs || document.updatedAtTs,
      document.submittedAt?.getTime(),
      new TaskMetadata(document?.metadata || (document as any).metadataId), //TODO: Something with task population
      document.isBlockchainConfirmed,
      document.isMetadataDefault,
      document.isDeleted,
      document.childIpId,
      document.childTokenId,
      document.resultData ? document.resultData : undefined,
      assignedAgent,
      invitedAgents,
      document.assignedValidator,
      document.validationReward,
      document.createdTransaction,
    );

    return task;
  }
}
