import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, PopulateOptions, UpdateQuery } from 'mongoose';
type ObjectId = Types.ObjectId;
import { BaseRepository } from '../../common/services/base.repository';
import { AgentStatisticsDocument } from '../schemas/agent-statistics.schema';
import { AgentDocument, PopulatedAgentDocument } from '../schemas/agent.schema';

@Injectable()
export class AgentRepository extends BaseRepository<AgentDocument> {
  private readonly logger = new Logger(AgentRepository.name);
  private readonly defaultPopulateConfig: PopulateOptions[] = [
    {
      path: 'invitedTaskIds',
      model: 'TaskDocument',
      populate: {
        path: 'metadataId',
        model: 'TaskMetadataDocument',
      },
    },
    {
      path: 'assignedTaskIds',
      model: 'TaskDocument',
      populate: {
        path: 'metadataId',
        model: 'TaskMetadataDocument',
      },
    },
    {
      path: 'completedTaskIds',
      model: 'TaskDocument',
      populate: {
        path: 'metadataId',
        model: 'TaskMetadataDocument',
      },
    },
    {
      path: 'metadataId',
      model: 'AgentMetadataDocument',
    },
  ];

  constructor(@InjectModel(AgentDocument.name) private readonly agentModel: Model<AgentDocument>) {
    super(agentModel);
  }

  findByAgentId = (agentId: string) => this.findOne({ agentId });

  // Base query methods
  findPopulatedByAgentId = (agentId: string) => this.findOneAndPopulate({ agentId });
  findPopulatedByCreatorWallets = (wallets: string[]) =>
    this.findAllAndPopulate({
      agentId: { $in: wallets.map(wallet => new RegExp(`^${wallet}$`, 'i')) },
    });
  findPopulatedById = (id: string) => this.findOneAndPopulate({ _id: id });
  findPopulatedByTopic = (topic: string) => this.findAllAndPopulate({ topics: { $in: [topic] } });
  findPopulatedFeaturedAgents = () => this.findAllAndPopulate({ 'metadata.isFeatured': true });

  async updateAgent(
    agentId: ObjectId,
    update: UpdateQuery<AgentDocument>,
  ): Promise<PopulatedAgentDocument | null> {
    return this.updateByAgentIdAndPopulate(agentId, update);
  }

  async addInvitedTask(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument | null> {
    return this.updateByIdAndPopulate(agentId, {
      $addToSet: { invitedTaskIds: taskMongoId },
    });
  }

  async addAssignedTask(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument | null> {
    return this.updateByIdAndPopulate(agentId, {
      $addToSet: { assignedTaskIds: taskMongoId },
      $pull: { invitedTaskIds: taskMongoId },
    });
  }

  async addCompletedTask(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument | null> {
    return this.updateByIdAndPopulate(agentId, {
      $addToSet: { completedTaskIds: taskMongoId },
    });
  }

  async removeTask(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument | null> {
    return this.updateByAgentIdAndPopulate(agentId, {
      $pull: {
        invitedTaskIds: taskMongoId,
        assignedTaskIds: taskMongoId,
        completedTaskIds: taskMongoId,
      },
    });
  }

  async moveTaskFromAssignedToCompleted(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument | null> {
    return this.updateByAgentIdAndPopulate(agentId, {
      $pull: { assignedTaskIds: taskMongoId },
      $addToSet: { completedTaskIds: taskMongoId },
    });
  }

  async updateAgentStatistics(
    agentId: ObjectId,
    taskCompleted: boolean,
    completionTime?: number,
    earnings?: string,
  ): Promise<PopulatedAgentDocument | null> {
    const agent = await this.findById(agentId);
    if (!agent) return null;

    const stats = agent.statistics || AgentStatisticsDocument.Default;

    if (taskCompleted) {
      stats.totalTasksCompleted = stats.totalTasksCompleted + 1;
      if (earnings) {
        stats.totalEarnings = stats.totalEarnings + earnings;
      }
      if (completionTime) {
        const currentAvgTime = stats.averageCompletionTime;
        const totalTasks = stats.totalTasksCompleted;
        stats.averageCompletionTime =
          (currentAvgTime * (totalTasks - 1) + completionTime) / totalTasks;
      }
      stats.lastActiveTimestamp = Date.now().toString();
    }

    return this.updateAgent(agentId, { statistics: stats });
  }

  private findOneAndPopulate = async (filter: FilterQuery<AgentDocument>) => {
    try {
      const doc = await this.findOne(filter);
      return doc ? this.populateAgent(doc) : null;
    } catch (error) {
      this.logger.warn(`Population failed: ${error.message}`);
      throw error;
    }
  };

  private findAllAndPopulate = async (
    filter: FilterQuery<AgentDocument>,
    options: { skip?: number; limit?: number } = {},
  ) => {
    try {
      const docs = await this.findAll(filter, options);
      return Promise.all(docs.map(doc => this.populateAgent(doc)));
    } catch (e) {
      this.logger.warn(`Population failed: ${e.message}`);
      throw e;
    }
  };

  private updateByIdAndPopulate = async (
    agentId: ObjectId,
    update: UpdateQuery<AgentDocument>,
  ): Promise<PopulatedAgentDocument | null> => {
    const agent = await this.model
      .findByIdAndUpdate({ _id: agentId }, update, { new: true })
      .exec();
    return agent ? this.populateAgent(agent) : null;
  };

  private updateByAgentIdAndPopulate = async (
    mongoId: ObjectId,
    update: UpdateQuery<AgentDocument>,
  ): Promise<PopulatedAgentDocument | null> => {
    const agent = await this.model.findOneAndUpdate(mongoId, update, { new: true }).exec();
    return agent ? this.populateAgent(agent) : null;
  };

  //TODO: Remove this and use mongo pipelines instead
  //Or not?..
  private populateAgent = async (agent: AgentDocument): Promise<PopulatedAgentDocument> => {
    const populated = await agent.populate(this.defaultPopulateConfig);
    const plainObject = populated.toObject();

    return {
      ...plainObject,
      invitedTasks: plainObject.invitedTaskIds,
      assignedTasks: plainObject.assignedTaskIds,
      completedTasks: plainObject.completedTaskIds,
      metadata: plainObject.metadataId,
      invitedTaskIds: undefined,
      assignedTaskIds: undefined,
      completedTaskIds: undefined,
      metadataId: undefined,
    } as unknown as PopulatedAgentDocument;
  };
}
