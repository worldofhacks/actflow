import { MarketLibAgentInfo } from '../../contracts';
import { decodeBytes32String } from 'ethers';
import { TaskDomainModel } from '../../task/domain/task';
import { TaskMapper } from '../../task/task.mapper';
import { AgentDomainModel } from '../core/agent';
import { AgentMetadata } from '../core/agent-metadata';
import { AgentTopicSkill } from '../core/agent-topic';
import {
  AgentRealtimeStatusDocument,
  SocialAnalyticsDocument,
} from '../schemas/agent-analytics.schema';
import { AgentDocument, PopulatedAgentDocument } from '../schemas/agent.schema';
import {
  AgentBalanceApiResponse,
  AgentDetailsApiResponse,
} from '../types/response/agent-details.response';
import { CreateAgentServiceDto } from '../types/service/create-agent.dto';
import { AgentMetadataMapper } from './agent-metadata.mapper';

export class AgentMapper {
  static fromDocument(document: PopulatedAgentDocument, skipTaskMapping = false): AgentDomainModel {
    const tasks = skipTaskMapping
      ? []
      : [
          ...document?.invitedTasks?.map(task => TaskMapper.fromPopulatedDocument(task)),
          ...document?.assignedTasks?.map(task => TaskMapper.fromPopulatedDocument(task)),
          ...document?.completedTasks?.map(task => TaskMapper.fromPopulatedDocument(task)),
        ];

    const agent = new AgentDomainModel(
      document._id.toString(),
      document.agentId,
      document.topic,
      document.skills,
      document.metadata,
      document.isPaused,
      document.isBlockchainConfirmed,
      document.isMetadataDefault || false,
      document.ipAssetId,
      document.canNftTokenId,
      document.licenseTermsId,
      document.creationTransaction,
      tasks,
      document.isDeleted,
    );

    if (document.analytics) {
      agent.attachAnalytics(document.analytics);
    }

    if (document.statistics) {
      agent.attachStatistics(document.statistics);
    }

    return agent;
  }

  static minimumAgentToDb(agent: AgentDomainModel): Partial<AgentDocument> {
    return {
      agentId: agent.agentId,
      topic: agent.topic,
      skills: agent.skills,
      metadataId: agent.metadata.id,

      ipAssetId: agent.ipAssetId,
      canNftTokenId: agent.canNftTokenId,
      licenseTermsId: agent.licenseTermsId,
      creationTransaction: agent.creationTransaction,

      isPaused: agent.isPaused,
      isBlockchainConfirmed: agent.isBlockchainConfirmed,
      isMetadataDefault: false,
      isDeleted: false,

      invitedTaskIds: [],
      assignedTaskIds: [],
      completedTaskIds: [],
      analytics: agent.analytics,
      statistics: agent.statistics,
    };
  }

  static toDomain(
    document: PopulatedAgentDocument,
    tasks: TaskDomainModel[] = [],
  ): AgentDomainModel {
    const agent = new AgentDomainModel(
      document._id.toString(),
      document.agentId,
      document.topic,
      document.skills,
      document.metadata,
      document.isPaused,
      document.isBlockchainConfirmed,
      document.isMetadataDefault || false,
      document.ipAssetId,
      document.canNftTokenId,
      document.licenseTermsId,
      document.creationTransaction,
      tasks,
      document.isDeleted,
    );

    if (document.analytics) {
      agent.attachAnalytics(document.analytics);
    }

    if (document.statistics) {
      agent.attachStatistics(document.statistics);
    }

    return agent;
  }

  public static extractTopicFromSkill(skill: string): string {
    const [topic, skillName] = skill.split(':');
    return topic;
  }

  public static extractSkillNameFromSkill(skill: string): string {
    const [topic, skillName] = skill.split(':');
    return skillName;
  }

  static fromContract(
    contractData: MarketLibAgentInfo,
    skills: AgentTopicSkill[],
    metadata: AgentMetadata,
  ): AgentDomainModel {
    const topic = this.extractTopicFromSkill(decodeBytes32String(contractData.topics[0]));

    const ipAssetId = contractData?.ipAssetId ?? '';
    const canNftTokenId = contractData?.nftTokenId?.toString() ?? '';
    const licenseTermsId = contractData?.licenseTermsId?.toString() ?? '';
    return new AgentDomainModel(
      '',
      contractData.id,
      topic,
      skills,
      metadata,
      contractData.paused,
      true, // isBlockchainConfirmed
      metadata.isValid, // isMetadataDefault
      ipAssetId,
      canNftTokenId,
      licenseTermsId,
      undefined, // creationTransaction
      [], // tasks
      false, // isDeleted
    );
  }

  static createPending(data: CreateAgentServiceDto, metadata: AgentMetadata): AgentDomainModel {
    return new AgentDomainModel(
      '',
      data.agentId,
      data.topic,
      data.skills,
      metadata,
      false, // isPaused
      false, // isBlockchainConfirmed
      false, // isMetadataDefault
      undefined, // ipAssetId
      undefined, // canNftTokenId
      undefined, // licenseTermsId
      data.creationTransaction,
      [], // tasks
      false, // isDeleted
    );
  }

  static toDetailedView(
    agent: AgentDomainModel,
    balance?: AgentBalanceApiResponse,
  ): AgentDetailsApiResponse {
    // const skills = agent.skills.map(skill => {
    //   return {
    //     ...skill,
    //     skillName: AgentMapper.extractSkillNameFromSkill(skill.skillName),
    //   };
    // });

    return {
      id: agent.mongoId,
      agentId: agent.agentId,
      ipAssetId: agent.ipAssetId,
      canNftTokenId: agent.canNftTokenId,
      licenseTermsId: agent.licenseTermsId,
      topic: agent.topic,
      skills: agent.skills,
      statistics: {
        ...agent.statistics,
        totalEarnings: Number(agent.statistics.totalEarnings),
      },
      metadata: AgentMetadataMapper.mapToApiResponse(agent.metadata),
      tasks: agent.tasks.map(task => TaskMapper.toSummaryView(task)),
      socialAnalytics: agent.analytics?.socialAnalytics ?? SocialAnalyticsDocument.Default,
      realtimeStatus: agent.analytics?.realtimeStatus ?? AgentRealtimeStatusDocument.Default,
      isPaused: agent.isPaused,
      isDeleted: agent.isDeleted,
      isBlockchainConfirmed: agent.isBlockchainConfirmed,
      isSocialAnalyticsPerformed:
        agent.analytics?.socialAnalytics?.lastUpdated !== null &&
        agent.analytics?.socialAnalytics?.lastUpdated !== undefined,
      relatedTransactions: agent?.relatedTransactions ? agent.relatedTransactions : [],
      balance: balance,
    };
  }
}
