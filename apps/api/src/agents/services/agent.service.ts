import { MarketLibAgentInfo, TaskState } from '../../contracts';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
type ObjectId = Types.ObjectId;
import { EventMapper } from '../../blockchain/event.mapper';
import { BlockchainEventRepository } from '../../blockchain/repository/events.repository';
import { PopulatedTaskDocument } from '../../task/schemas/task.schema';
import { TaskMapper } from '../../task/task.mapper';
import { UserService } from '../../user/services/user.service';
import { WalletEncryptionService } from '../../wallet/wallet.encryption.service';
import { AgentDomainModel } from '../core/agent';
import { AgentMetadata } from '../core/agent-metadata';
import { AgentTopicSkill } from '../core/agent-topic';
import { AgentMapper } from '../mappers/agent.mapper';
import { AgentRepository } from '../repository/agent.repository';
import {
  AgentRealtimeStatusDocument,
  SocialAnalyticsDocument,
} from '../schemas/agent-analytics.schema';
import { AgentMetadataDocument } from '../schemas/agent-metadata.schema';
import { AgentStatisticsDocument } from '../schemas/agent-statistics.schema';
import { AgentDocument, PopulatedAgentDocument } from '../schemas/agent.schema';
import { TransactionInfoDocument } from '../schemas/transaction-info.schema';
import { AgentFilterDto } from '../types/request/agent-filter.dto';
import { AgentDetailsApiResponse } from '../types/response/agent-details.response';
import { CreateAgentServiceDto } from '../types/service/create-agent.dto';
import { AgentMetadataService } from './agent-metadata.service';
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly userService: UserService, //TODO: We should remove it from here
    private readonly encryptionService: WalletEncryptionService,
    private readonly agentMetadataService: AgentMetadataService,
    private readonly blockchainEventRepository: BlockchainEventRepository,
  ) {}

  async findIdByAgentId(agentId: string): Promise<ObjectId | null> {
    return this.agentRepository.findIdByField('agentId', agentId);
  }

  findByAgentId = (agentId: string) => {
    return this.agentRepository.findByAgentId(agentId);
  };

  findById = (mongoId: string) => {
    return this.agentRepository.findById(mongoId);
  };

  async updateAgent(
    agentId: ObjectId,
    agentData: Partial<AgentDomainModel>,
  ): Promise<AgentDetailsApiResponse> {
    const agent = await this.agentRepository.updateAgent(agentId, agentData);
    return AgentMapper.toDetailedView(AgentMapper.fromDocument(agent));
  }

  async savePendingAgent(agentData: CreateAgentServiceDto, metadata: AgentMetadata) {
    const agent = AgentMapper.createPending(agentData, metadata);
    agent
      .attachAnalytics({
        realtimeStatus: AgentRealtimeStatusDocument.Default,
        socialAnalytics: SocialAnalyticsDocument.Default,
      })
      .attachStatistics(AgentStatisticsDocument.Default);
    const agentDocument = AgentMapper.minimumAgentToDb(agent);
    const createdAgent = await this.agentRepository.create(agentDocument);
    return createdAgent;
  }

  async checkIfExists(agentAddress: string) {
    return await this.agentRepository.checkIfExists({ agentId: agentAddress });
  }

  async saveAgentFromBlockchain(
    agentInfo: MarketLibAgentInfo,
    txInfo: TransactionInfoDocument,
    skills: AgentTopicSkill[],
  ): Promise<any> {
    try {
      this.logger.log(`Creating agent from blockchain: ${agentInfo.id}`);

      const metadata = await this.agentMetadataService.getOrCreateById(agentInfo.metadata);

      const newAgent = AgentMapper.fromContract(agentInfo, skills, new AgentMetadata(metadata));
      newAgent.creationTransaction = txInfo;

      newAgent
        .attachAnalytics({
          realtimeStatus: AgentRealtimeStatusDocument.Default,
          socialAnalytics: SocialAnalyticsDocument.Default,
        })
        .attachStatistics(AgentStatisticsDocument.Default);

      const toDb = AgentMapper.minimumAgentToDb(newAgent);
      const createdAgent = await this.agentRepository.create(toDb);
      return createdAgent;
    } catch (error) {
      this.logger.error(`Error creating agent from blockchain: ${error.message}`);
      throw error;
    }
  }

  private buildAgentFilters(filter?: AgentFilterDto): {
    agentFilter: FilterQuery<AgentDocument>;
    metadataFilter: FilterQuery<AgentMetadataDocument>;
  } {
    const agentFilter: FilterQuery<AgentDocument> = {};
    const metadataFilter: FilterQuery<AgentMetadataDocument> = {};

    if (filter?.topic) {
      agentFilter['topic'] = { $regex: `${filter.topic}`, $options: 'i' };
    }

    if (filter?.isAutoAssignable !== undefined) {
      agentFilter['skills'] = {
        $elemMatch: {
          enabled: true,
          autoAssign: filter.isAutoAssignable,
        },
      };
    }

    if (filter?.isFeatured !== undefined) {
      agentFilter.isFeatured = filter.isFeatured;
    }

    if (filter?.isValid !== undefined) {
      agentFilter.isMetadataDefault = false;
      agentFilter.isBlockchainConfirmed = true;
    }

    // Handle statistics filter
    if (filter?.totalTasksCompletedMoreThan !== undefined) {
      agentFilter['statistics.totalTasksCompleted'] = { $gt: filter.totalTasksCompletedMoreThan };
    }

    // Handle analytics filter
    if (filter?.followersMoreThan !== undefined) {
      agentFilter['analytics.socialAnalytics.followers'] = { $gt: filter.followersMoreThan };
    }

    if (filter?.profileType) {
      metadataFilter.profileType = filter.profileType;
    }

    if (filter?.name) {
      metadataFilter.name = { $regex: filter.name, $options: 'i' };
    }

    if (filter?.serviceType) {
      metadataFilter.serviceType = filter.serviceType;
    }

    return { agentFilter, metadataFilter };
  }

  async searchAgents(filter?: AgentFilterDto): Promise<AgentDomainModel[]> {
    const { agentFilter, metadataFilter } = this.buildAgentFilters(filter);

    const buildEventLookup = (events: any[]) => {
      return events.reduce((acc, event) => {
        acc[event.sender] = EventMapper.fromDocumentsToApiResponse([event]);
        return acc;
      }, {});
    };

    const agents: PopulatedAgentDocument[] = await this.agentRepository.findAllPopulated(
      agentFilter,
      {
        path: 'metadata',
        model: 'AgentMetadataDocument',
        match: metadataFilter,
      },
      {
        skip: filter.offset,
        limit: filter.limit,
      },
    );

    const blockchainEvents = await this.blockchainEventRepository.findBySenders(
      agents.map(agent => agent.agentId),
      10,
    );

    const transactions = EventMapper.fromDocumentsToApiResponse(blockchainEvents);
    const blockchainEventsLookup = buildEventLookup(transactions);

    return agents.map(agent => {
      const domainModel = AgentMapper.toDomain(agent);
      domainModel.attachTransactions(blockchainEventsLookup[agent.agentId] || []);
      return domainModel;
    });
  }

  async findPopulatedByAgentId(agentId: string): Promise<AgentDomainModel | null> {
    const agent = await this.agentRepository.findPopulatedByAgentId(agentId);
    if (!agent) return null;
    const blockchainEvents = await this.blockchainEventRepository.findBySenders([agentId]);
    const transactions = EventMapper.fromDocumentsToApiResponse(blockchainEvents);
    const tasks: PopulatedTaskDocument[] = [
      ...agent.invitedTasks,
      ...agent.assignedTasks,
      ...agent.completedTasks,
    ];

    const tasksDomain = tasks.map(task => TaskMapper.fromPopulatedDocument(task));
    return AgentMapper.toDomain(agent, tasksDomain).attachTransactions(transactions);
  }

  async findPopulatedById(id: string): Promise<AgentDomainModel> {
    const agent = await this.agentRepository.findPopulatedById(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    const tasks: PopulatedTaskDocument[] = [
      ...agent.invitedTasks,
      ...agent.assignedTasks,
      ...agent.completedTasks,
    ];

    const blockchainEvents = await this.blockchainEventRepository.findBySenders([agent.agentId]);
    const transactions = EventMapper.fromDocumentsToApiResponse(blockchainEvents);

    const tasksDomain = tasks.map(task => TaskMapper.fromPopulatedDocument(task));
    return AgentMapper.toDomain(agent, tasksDomain).attachTransactions(transactions);
  }

  async getFeaturedAgents(): Promise<AgentDomainModel[]> {
    const featuredAgents = await this.agentRepository.findPopulatedFeaturedAgents();
    return Promise.all(featuredAgents.map(agent => AgentMapper.toDomain(agent)));
  }

  async getAgentsByUser(userId: string): Promise<AgentDomainModel[]> {
    try {
      this.logger.log(`Getting agents for user ${userId}`);
      const userWallets = await this.userService.getUserWallets(userId);

      const agents = await this.agentRepository.findPopulatedByCreatorWallets(
        userWallets.map(wallet => wallet.address),
      );
      return Promise.all(agents.map(agent => AgentMapper.toDomain(agent)));
    } catch (error) {
      this.logger.error(`Error getting agents for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getUserWalletPrivateKey(userId: any, walletAddress: string): Promise<string> {
    const privateKeyForWallet = await this.userService.getUserWalletPrivateKey(
      userId,
      walletAddress,
    );
    return this.encryptionService.decryptPrivateKey(privateKeyForWallet);
  }

  async addTaskToAgent(
    agentId: ObjectId,
    taskObjectId: ObjectId,
    status: TaskState,
  ): Promise<PopulatedAgentDocument> {
    switch (status) {
      case TaskState.INVITED:
        return this.agentRepository.addInvitedTask(agentId, taskObjectId);
      case TaskState.ASSIGNED:
        return this.agentRepository.addAssignedTask(agentId, taskObjectId);
      case TaskState.COMPLETED:
        return this.agentRepository.addCompletedTask(agentId, taskObjectId);
      default:
        throw new Error(`Invalid task state: ${status}`);
    }
  }

  async removeTaskFromAgent(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument> {
    return this.agentRepository.removeTask(agentId, taskMongoId);
  }

  async updateAgentParams(
    agentId: ObjectId,
    params: {
      fee?: string;
      autoAssign?: boolean;
      executionDuration?: number;
    },
  ): Promise<PopulatedAgentDocument> {
    try {
      this.logger.log(`Updating parameters for agent ${agentId}`);

      const agent = await this.agentRepository.findById(agentId);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      const updates: any = {};
      if (params.fee !== undefined) updates.fee = params.fee;
      if (params.autoAssign !== undefined) updates.autoAssign = params.autoAssign;
      if (params.executionDuration !== undefined)
        updates.executionDuration = params.executionDuration;

      return this.agentRepository.updateAgent(agentId, updates);
    } catch (error) {
      this.logger.error(`Error updating agent parameters: ${error.message}`);
      throw error;
    }
  }

  async updateAgentPauseState(agentId: string, isPaused: boolean): Promise<AgentDocument> {
    try {
      this.logger.log(`Updating pause state for agent ${agentId} to ${isPaused}`);

      const agent = await this.agentRepository.findByAgentId(agentId);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      return this.agentRepository.update(agent._id.toString(), { isPaused });
    } catch (error) {
      this.logger.error(`Error updating agent pause state: ${error.message}`);
      throw error;
    }
  }

  async confirmAgent(
    agentId: string,
    agentData: {
      ipAssetId: string;
      canNftTokenId: string;
      licenseTermsId: string;
      creationTransaction?: TransactionInfoDocument;
      isBlockchainConfirmed: boolean;
    },
  ): Promise<AgentDocument> {
    try {
      this.logger.log(`Confirming agent with ID ${agentId}`);

      const pendingAgent = await this.agentRepository.findOne({
        agentId: agentId,
      });

      const updates = {
        agentId,
        ipAssetId: agentData.ipAssetId,
        canNftTokenId: agentData.canNftTokenId,
        licenseTermsId: agentData.licenseTermsId,
        creationTransaction: agentData.creationTransaction,
        isBlockchainConfirmed: agentData.isBlockchainConfirmed,
      };

      const confirmedAgent = await this.agentRepository.update(
        pendingAgent._id.toString(),
        updates,
      );

      if (!confirmedAgent) {
        throw new Error(`Failed to update agent with ID ${confirmedAgent._id}`);
      }

      this.logger.log(`Agent ${agentId} confirmed successfully`);
      return confirmedAgent;
    } catch (error) {
      this.logger.error(`Error confirming agent: ${error.message}`);
      throw error;
    }
  }

  async updateStatisticsForCompletedTask(
    agentId: ObjectId,
    earnings: string,
    completionTime?: number,
  ): Promise<boolean> {
    try {
      this.logger.log(`Updating statistics for agent ${agentId}`);

      await this.agentRepository.updateAgentStatistics(agentId, true, completionTime, earnings);

      return true;
    } catch (error) {
      this.logger.error(`Error updating agent statistics: ${error.message}`);
      return false;
    }
  }

  async updateLastOnline(
    agentId: string,
    instanceId?: string,
    lastProcessedBlock?: number,
  ): Promise<AgentDocument> {
    try {
      this.logger.log(`Updating last online status for agent ${agentId}`);

      const agent = await this.agentRepository.findPopulatedByAgentId(agentId);
      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      const analytics = agent.analytics || {};
      if (!analytics.realtimeStatus) {
        analytics.realtimeStatus = AgentRealtimeStatusDocument.Default;
      }

      analytics.realtimeStatus.lastOnline = new Date();
      if (instanceId !== undefined) {
        analytics.realtimeStatus.instanceId = instanceId;
      }
      if (lastProcessedBlock !== undefined) {
        analytics.realtimeStatus.lastProcessedBlock = lastProcessedBlock;
      }

      return this.agentRepository.update(agent._id.toString(), { analytics });
    } catch (error) {
      this.logger.error(`Error updating agent last online status: ${error.message}`);
      throw error;
    }
  }

  async completeAgentTask(
    agentId: ObjectId,
    taskMongoId: ObjectId,
  ): Promise<PopulatedAgentDocument> {
    return this.agentRepository.moveTaskFromAssignedToCompleted(agentId, taskMongoId);
  }
}
