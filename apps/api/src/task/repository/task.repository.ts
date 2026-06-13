import { TaskState } from '../../contracts';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ObjectId, UpdateQuery } from 'mongoose';
import { BaseRepository } from '../../common/services/base.repository';
import { PopulatedTaskDocument, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class TaskRepository extends BaseRepository<TaskDocument> {
  private readonly logger = new Logger(TaskRepository.name);

  constructor(@InjectModel(TaskDocument.name) private readonly taskModel: Model<TaskDocument>) {
    super(taskModel);
  }

  findByTaskId = (taskId: string) => this.findOne({ taskId: taskId });

  findPopulatedByTaskId = (taskId: string) => this.findOneAndPopulate({ taskId: taskId });
  findPopulatedById = (id: ObjectId) => this.findOneAndPopulate({ _id: id });
  findPopulatedByCreator = (creator: string) => this.findAllAndPopulate({ creator });
  findPopulatedByState = (state: TaskState) => this.findAllAndPopulate({ state });
  findPopulatedByTopic = (topic: string) => this.findAllAndPopulate({ topic });
  findPopulatedByAssignedAgent = (agentAddress: string) =>
    this.findAllAndPopulate({ assignedAgentId: agentAddress });
  findPopulatedByInvitedAgent = (agentAddress: string) =>
    this.findAllAndPopulate({ invitedAgentIds: agentAddress });
  findPopulatedTasksRequiringApproval = () =>
    this.findAllAndPopulate({ serviceApprove: true, state: TaskState.SUBMITTED });
  searchPopulatedTasks = (
    filter: FilterQuery<TaskDocument> = {},
    options: { skip?: number; limit?: number } = {},
  ) => this.findAllAndPopulate(filter, options);

  updateTask = async (
    taskMongoId: ObjectId,
    update: UpdateQuery<TaskDocument>,
  ): Promise<PopulatedTaskDocument | null> => {
    const task = await this.model
      .findOneAndUpdate({ taskId: taskMongoId }, update, { new: true })
      .exec();
    return task ? this.populateTask(task) : null;
  };

  updateTaskState = async (
    taskMongoId: ObjectId,
    state: TaskState,
  ): Promise<PopulatedTaskDocument | null> => {
    const updates: UpdateQuery<TaskDocument> = {
      state,
      [this.getStateTimestampField(state)]: new Date(),
    };
    return this.updateByIdAndPopulate(taskMongoId, updates);
  };

  assignToAgent = async (
    taskMongoId: ObjectId,
    agentAddress: ObjectId,
    agreedAmount: string,
  ): Promise<PopulatedTaskDocument | null> => {
    return this.updateByIdAndPopulate(taskMongoId, {
      assignedAgentId: agentAddress,
      finalReward: agreedAmount,
      state: TaskState.ASSIGNED,
      assignedAt: new Date(),
    });
  };

  addInvitedAgent = async (
    taskMongoId: ObjectId,
    agentMongoId: ObjectId,
  ): Promise<PopulatedTaskDocument | null> => {
    return this.updateByIdAndPopulate(taskMongoId, {
      $addToSet: { invitedAgentIds: agentMongoId },
      state: TaskState.INVITED,
      inviteAt: new Date(),
    });
  };

  updateTaskResult = async (
    taskMongoId: ObjectId,
    resultData: string,
    parsedResult?: unknown,
  ): Promise<PopulatedTaskDocument | null> => {
    const updates: UpdateQuery<TaskDocument> = {
      resultData,
      state: TaskState.SUBMITTED,
      submittedAt: new Date(),
      ...(parsedResult && { parsedResult }),
    };
    return this.updateByIdAndPopulate(taskMongoId, updates);
  };

  updateTaskDecline = async (
    taskMongoId: ObjectId,
    reason: string,
    declineState: TaskState.DECLINED_BY_OWNER | TaskState.DECLINED_BY_VALIDATOR,
  ): Promise<PopulatedTaskDocument | null> => {
    const updateData: any = {
      state: declineState,
      declineReason: reason,
    };

    const timestampField = this.getStateTimestampField(declineState);
    updateData[timestampField] = new Date();

    return this.updateByIdAndPopulate(taskMongoId, updateData);
  };

  updateTaskDispute = async (
    taskMongoId: ObjectId,
    reason: string,
    disputeState: TaskState.DISPUTED_BY_OWNER | TaskState.DISPUTED_BY_AGENT,
  ): Promise<PopulatedTaskDocument | null> => {
    const updateData: any = {
      state: disputeState,
      disputeReason: reason,
    };

    const timestampField = this.getStateTimestampField(disputeState);
    updateData[timestampField] = new Date();

    return this.updateByIdAndPopulate(taskMongoId, updateData);
  };

  resolveDispute = async (
    taskMongoId: ObjectId,
    clientAmount: string,
    agentAmount: string,
    validatorAmount: string,
  ): Promise<PopulatedTaskDocument | null> => {
    return this.updateByIdAndPopulate(taskMongoId, {
      state: TaskState.RESOLVED,
      clientAmount,
      agentAmount,
      validatorAmount,
      resolvedAt: new Date(),
    });
  };

  deleteAll = async () => {
    await this.model.deleteMany({});
  };

  private findOneAndPopulate = async (filter: FilterQuery<TaskDocument>) => {
    try {
      const doc = await this.findOne(filter);
      return doc ? this.populateTask(doc) : null;
    } catch (error) {
      this.logger.warn(`Population failed: ${error.message}`);
      throw error;
    }
  };

  private findAllAndPopulate = async (
    filter: FilterQuery<TaskDocument>,
    options: { skip?: number; limit?: number } = {},
  ) => {
    try {
      const docs = await this.findAll(filter, options);
      return Promise.all(docs.map(doc => this.populateTask(doc)));
    } catch (error) {
      this.logger.warn(`Population failed: ${error.message}`);
      throw error;
    }
  };

  private updateByIdAndPopulate = async (
    taskMongoId: ObjectId,
    update: UpdateQuery<TaskDocument>,
  ): Promise<PopulatedTaskDocument | null> => {
    const task = await this.model.findByIdAndUpdate(taskMongoId, update, { new: true }).exec();
    return task ? this.populateTask(task) : null;
  };

  private getStateTimestampField = (state: TaskState): string => {
    const stateTimestampMap: Record<TaskState, string> = {
      [TaskState.PENDING]: 'pendingAt',
      [TaskState.INVITED]: 'inviteAt',
      [TaskState.ASSIGNED]: 'assignedAt',
      [TaskState.COMPLETED]: 'completedAt',
      [TaskState.DELETED]: 'deletedAt',
      [TaskState.SUBMITTED]: 'submittedAt',
      [TaskState.VALIDATED]: 'validatedAt',
      [TaskState.DECLINED_BY_OWNER]: 'declinedByOwnerAt',
      [TaskState.DECLINED_BY_VALIDATOR]: 'declinedByValidatorAt',
      [TaskState.DISPUTED_BY_OWNER]: 'disputedByOwnerAt',
      [TaskState.DISPUTED_BY_AGENT]: 'disputedByAgentAt',
      [TaskState.RESOLVED]: 'resolvedAt',
      [TaskState.EXPIRED]: 'expiredAt',
    };
    return stateTimestampMap[state] ?? 'updatedAt';
  };

  private populateTask = async (task: TaskDocument): Promise<PopulatedTaskDocument> => {
    const populateConfig = [];

    populateConfig.push({
      path: 'metadataId',
      model: 'TaskMetadataDocument',
    });

    if (task.invitedAgentIds?.length > 0) {
      populateConfig.push({
        path: 'invitedAgentIds',
        model: 'AgentDocument',
        populate: {
          path: 'metadataId',
          model: 'AgentMetadataDocument',
        },
      });
    }

    // Only populate assigned agent if it exists
    if (task.assignedAgentId) {
      populateConfig.push({
        path: 'assignedAgentId',
        model: 'AgentDocument',
        // REMOVE localField and foreignField
        justOne: true,
        populate: {
          path: 'metadataId',
          model: 'AgentMetadataDocument',
        },
      });
    }

    const populated = await task.populate(populateConfig);
    const plainObject = populated.toObject();

    return {
      ...plainObject,
      metadata: plainObject.metadataId,
      invitedAgents: plainObject.invitedAgentIds || [],
      assignedAgent: plainObject.assignedAgentId || null,
      metadataId: undefined,
      invitedAgentIds: undefined,
      assignedAgentId: undefined,
    } as unknown as PopulatedTaskDocument;
  };
}
