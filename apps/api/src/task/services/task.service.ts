import { MarketLibTask, TaskState } from '../../contracts';
import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
type ObjectId = Types.ObjectId;
import { AgentDomainModel } from '../../agents/core/agent';
import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';
import { EventMapper } from '../../blockchain/event.mapper';
import { BlockchainEventRepository } from '../../blockchain/repository/events.repository';
import { ContractConfigService } from '../../config/service/contract.config.service';
import { TaskDomainModel } from '../domain/task';
import { TaskMetadata } from '../domain/task-metadata';
import { TaskRepository } from '../repository/task.repository';
import { TaskDocument } from '../schemas/task.schema';
import { TaskMapper } from '../task.mapper';
import { TaskFilterDto } from '../types/request/task-filter.dto';
import { CreateTaskServiceDto } from '../types/services/create-task.dto';
import { TaskMetadataService } from './task-metadata.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskMetadataService: TaskMetadataService,
    private readonly blockchainEventRepository: BlockchainEventRepository,
    private readonly contractConfigService: ContractConfigService,
  ) {}

  async findIdByTaskId(taskId: string): Promise<ObjectId | null> {
    return this.taskRepository.findIdByField('taskId', taskId);
  }

  /**
   * GAP 4 — BIND a successful payment / World free-trial to the marketplace task: mark the
   * task UNLOCKED (funded) so it can proceed. Tied to the payment receipt for audit. An
   * unpaid task is never unlocked. Returns the mongo id of the unlocked task, or null if no
   * task exists for the taskId yet (e.g. it is created on-chain after payment).
   */
  async unlockTask(
    taskId: string,
    data: { method: 'x402' | 'world-trial'; mock: boolean; receiptId?: string },
  ): Promise<ObjectId | null> {
    const updated = await this.taskRepository.markUnlocked(taskId, data);
    if (!updated) return null;
    this.logger.log(
      `task ${taskId} UNLOCKED via ${data.method}${data.mock ? ' (mock)' : ''} -> ${updated._id}`,
    );
    return updated._id as ObjectId;
  }

  /** Tie a PaymentReceipt id back onto an already-unlocked task (audit). */
  async attachUnlockReceipt(taskMongoId: ObjectId, receiptId: string): Promise<void> {
    await this.taskRepository.attachUnlockReceipt(taskMongoId, receiptId);
  }

  //TODO: this one delete
  findPopulatedById = (mongoId: ObjectId) => {
    return this.taskRepository.findPopulatedById(mongoId);
  };

  //TODO: We using this method to take some part of model
  findByTaskId = (taskId: string) => {
    return this.taskRepository.findByTaskId(taskId);
  };

  findById = (mongoId: ObjectId) => {
    return this.taskRepository.findById(mongoId);
  };

  saveMetadata = (metadata: TaskMetadata) => {
    return this.taskMetadataService.saveMetadata(metadata);
  };

  async checkIfExists(taskId: string) {
    return await this.taskRepository.checkIfExists({ taskId });
  }

  getTaskByTaskId = async (taskId: string): Promise<TaskDomainModel | null> => {
    const populatedTaskDocument = await this.taskRepository.findPopulatedByTaskId(taskId);
    if (!populatedTaskDocument) return null;

    const blockchainEvents = await this.blockchainEventRepository.findByTaskId(taskId);
    const transactions = EventMapper.fromDocumentsToApiResponse(blockchainEvents);
    return TaskMapper.fromPopulatedDocument(populatedTaskDocument).attachTransactions(transactions);
  };

  searchTasks = async (filterDto: TaskFilterDto = {}): Promise<TaskDomainModel[]> => {
    const query = await this.buildFilterQuery(filterDto);
    const tasks = await this.taskRepository.searchPopulatedTasks(query, {
      skip: filterDto.offset,
      limit: filterDto.limit,
    });

    const blockchainEvents = await this.blockchainEventRepository.findByTaskIds(
      tasks.map(task => task.taskId),
    );

    const blockchainEventsLookup = this.buildEventLookup(blockchainEvents);
    return tasks.map(task =>
      TaskMapper.fromPopulatedDocument(task).attachTransactions(
        blockchainEventsLookup[task.taskId],
      ),
    );
  };

  savePendingTask = (taskData: CreateTaskServiceDto, metadata: TaskMetadata) => {
    const task = TaskMapper.createPending(taskData, metadata);
    const taskDocument = TaskMapper.minimumTaskToDb(task);
    return this.taskRepository.create(taskDocument);
  };

  saveTaskFromBlockchain = async (
    taskData: MarketLibTask,
    txInfo: TransactionInfoDocument,
    agent: AgentDomainModel,
  ) => {
    const metadata = await this.taskMetadataService.getOrCreateById(taskData.payload);
    const task = TaskMapper.fromContract(taskData, new TaskMetadata(metadata))
      .attachAgent(agent)
      .attachCreationTransaction(txInfo);
    const taskDocument = TaskMapper.minimumTaskToDb(task);
    return this.taskRepository.create(taskDocument);
  };

  updateTask = async (
    taskMongoId: ObjectId,
    taskData: Partial<TaskDocument>,
  ): Promise<TaskDomainModel> => {
    const updatedTask = await this.taskRepository.updateTask(taskMongoId, taskData);
    return TaskMapper.fromPopulatedDocument(updatedTask);
  };

  assignTask = async (taskData: {
    taskMongoId: ObjectId;
    assignedAgent: ObjectId;
    finalReward?: string;
  }): Promise<TaskDomainModel> => {
    const updatedTask = await this.taskRepository.assignToAgent(
      taskData.taskMongoId,
      taskData.assignedAgent,
      taskData.finalReward || '0',
    );
    return TaskMapper.fromPopulatedDocument(updatedTask);
  };

  updateTaskState = async (taskMongoId: ObjectId, state: TaskState): Promise<TaskDomainModel> => {
    const updatedTask = await this.taskRepository.updateTaskState(taskMongoId, state);
    return TaskMapper.fromPopulatedDocument(updatedTask);
  };

  addInvitedAgent = async (
    taskMongoId: ObjectId,
    agentMongoId: ObjectId,
  ): Promise<TaskDomainModel> => {
    const task = await this.taskRepository.addInvitedAgent(taskMongoId, agentMongoId);
    return TaskMapper.fromPopulatedDocument(task);
  };

  updateTaskResult = async (
    taskMongoId: ObjectId,
    resultData: string,
    parsedResult?: unknown,
  ): Promise<TaskDomainModel> => {
    const task = await this.taskRepository.updateTaskResult(taskMongoId, resultData, parsedResult);
    return TaskMapper.fromPopulatedDocument(task);
  };

  updateTaskDecline = async (
    taskMongoId: ObjectId,
    reason: string,
    declineState: TaskState.DECLINED_BY_OWNER | TaskState.DECLINED_BY_VALIDATOR,
  ): Promise<TaskDomainModel> => {
    const task = await this.taskRepository.updateTaskDecline(taskMongoId, reason, declineState);
    return TaskMapper.fromPopulatedDocument(task);
  };

  updateTaskDispute = async (
    taskMongoId: ObjectId,
    reason: string,
    disputeState: TaskState.DISPUTED_BY_OWNER | TaskState.DISPUTED_BY_AGENT,
  ): Promise<TaskDomainModel> => {
    const task = await this.taskRepository.updateTaskDispute(taskMongoId, reason, disputeState);
    return TaskMapper.fromPopulatedDocument(task);
  };

  updateTaskResolution = async (
    taskMongoId: ObjectId,
    clientAmount: string,
    agentAmount: string,
    validatorAmount: string,
  ): Promise<TaskDomainModel> => {
    const task = await this.taskRepository.resolveDispute(
      taskMongoId,
      clientAmount,
      agentAmount,
      validatorAmount,
    );
    return TaskMapper.fromPopulatedDocument(task);
  };

  getTasksRequiringServiceApproval = async (): Promise<TaskDomainModel[]> => {
    const tasks = await this.taskRepository.findPopulatedTasksRequiringApproval();
    return tasks.map(task => TaskMapper.fromPopulatedDocument(task));
  };

  deleteTask = async (taskId: string): Promise<boolean> => {
    return this.taskRepository.deleteByKey(taskId, 'taskId');
  };

  confirmTask = async (
    taskMongoId: ObjectId,
    blockchainData: MarketLibTask,
  ): Promise<TaskDocument> => {
    const pendingTask = await this.taskRepository.findOne({ _id: taskMongoId });
    const metadata = await this.taskMetadataService.getOrCreateById(pendingTask.metadataId);
    const task = TaskMapper.fromContract(blockchainData, metadata.toObject());

    const updates = {
      isBlockchainConfirmed: true,
      isDeleted: false,

      childIpId: task.childIpId,
      childTokenId: task.childTokenId,
      createdAtTs: task.createdAtTs,
      updatedAtTs: task.updatedAtTs,
      submissionDuration: task.submissionDuration,
      executionDuration: task.executionDuration,
      reward: task.reward,
      assignedAgent: task.assignedAgent,
      state: task.state,
      assignedValidator: task.assignedValidator,
      validationReward: task.validationReward,
    };
    return this.taskRepository.update(pendingTask._id.toString(), updates);
  };

  private buildFilterQuery = async (
    filterDto: TaskFilterDto,
  ): Promise<FilterQuery<TaskDocument>> => {
    const query: FilterQuery<TaskDocument> = {};

    if (filterDto.state !== undefined) query.state = filterDto.state;
    if (filterDto.creatorWallets) query.creator = { $in: filterDto.creatorWallets };
    if (filterDto.topic) query.topic = filterDto.topic;

    const agentFilters = [];

    if (filterDto.assignedAgents?.length) {
      agentFilters.push({ assignedAgentId: { $in: filterDto.assignedAgents } });
    }

    if (filterDto.invitedAgents?.length) {
      agentFilters.push({ invitedAgentIds: { $in: filterDto.invitedAgents } });
    }

    if (agentFilters.length > 0) {
      query.$or = agentFilters;
    }

    if (filterDto.validationEligible) {
      const config = await this.contractConfigService.getLatestConfig();
      const validationDelay = config.validationDelay;
      const serviceDelay = config.serviceDelay;

      const currentTime = Math.floor(Date.now() / 1000);

      const emptyValidatorCondition = {
        $or: [
          { assignedValidator: null },
          { assignedValidator: '0x0000000000000000000000000000000000000000' },
        ],
      };

      const validationRewardCondition = {
        $expr: {
          $gt: [{ $convert: { input: '$validationReward', to: 'double', onError: 0 } }, 0],
        },
      };

      query.$and = [
        emptyValidatorCondition,
        validationRewardCondition,
        {
          $or: [
            // Case 1: SUBMITTED tasks (state 5) with time conditions
            {
              $and: [
                { state: TaskState.SUBMITTED },
                {
                  updatedAtTs: {
                    $lte: currentTime - validationDelay,
                    $gte: currentTime - serviceDelay,
                  },
                },
              ],
            },
            // Case 2: DECLINED_BY_OWNER tasks (state 7) with no time conditions
            { state: TaskState.DECLINED_BY_OWNER },
          ],
        },
      ];
    }

    return query;
  };

  private buildEventLookup = (events: any[]) => {
    return events.reduce((acc, event) => {
      acc[event.taskId] = EventMapper.fromDocumentsToApiResponse([event]);
      return acc;
    }, {});
  };
}
