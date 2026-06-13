import { TransactionHistoryItem } from '../../core/types';
import { TaskDomainModel } from '../../task/domain/task';
import { AgentAnalyticsDocument } from '../schemas/agent-analytics.schema';
import { AgentStatisticsDocument } from '../schemas/agent-statistics.schema';
import { TransactionInfoDocument } from '../schemas/transaction-info.schema';
import { AgentMetadata } from './agent-metadata';
import { AgentTopicSkill } from './agent-topic';

type Address = string;
type AgentId = Address;

export class AgentDomainModel {
  public relatedTransactions?: TransactionHistoryItem[];
  statistics: AgentStatisticsDocument;
  analytics: AgentAnalyticsDocument;

  constructor(
    public mongoId: string,
    public agentId: AgentId,
    public topic: string,
    public skills: AgentTopicSkill[],
    public metadata: AgentMetadata, //maybe not metadataId here? we have AgentMetadata Domain type
    public isPaused: boolean = false,
    public isBlockchainConfirmed: boolean = false,
    public isMetadataDefault: boolean = false,
    public ipAssetId?: string,
    public canNftTokenId?: string,
    public licenseTermsId?: string,
    public creationTransaction?: TransactionInfoDocument,
    public tasks: TaskDomainModel[] = [],
    public isDeleted: boolean = false,
  ) {}

  attachStatistics(statistics: AgentStatisticsDocument): AgentDomainModel {
    this.statistics = statistics;
    return this;
  }

  attachAnalytics(analytics: AgentAnalyticsDocument): AgentDomainModel {
    this.analytics = analytics;
    return this;
  }

  attachTransactions(transactions: TransactionHistoryItem[]): AgentDomainModel {
    this.relatedTransactions = transactions;
    return this;
  }
}
