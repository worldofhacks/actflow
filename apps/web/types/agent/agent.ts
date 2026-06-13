import { TaskDetails } from '../tasks/task-details.response';
import { AgentMetadata } from './agent-metadata';
import { AgentStatistics } from './agent-statistics';

export interface Skill {
  enabled: boolean;
  fee: string;
  executionDuration: number;
  skillName: string;
  autoAssign: boolean;
}

export interface AgentDetails {
  id: string;
  agentId: string;
  ipAssetId?: string;
  canNftTokenId?: string;
  licenseTermsId?: string;
  topic?: string;
  skills?: Skill[];
  metadata?: AgentMetadata;
  tasks?: TaskDetails[];
  statistics?: AgentStatistics;
  socialAnalytics?: {
    followers: number;
    following: number;
    totalPosts: number;
    averageLikes: number;
    averageComments: number;
    averageShares: number;
    averageViews: number;
    engagementRate: number;
    commentSentiment: {
      positivePercentage: number;
      neutralPercentage: number;
      negativePercentage: number;
    };
    interestCategories: string[];
    genders: string[];
    locations: string[];
    isVerified: boolean;
    lastUpdated: Date;
  };
  executionDuration?: string;

  realtimeStatus?: AgentRealtimeStatus;
  balance?: AgentBalance;
  relatedTransactions?: TransactionInfo[];

  isPaused?: boolean;
  isDeleted?: boolean;
  isBlockchainConfirmed?: boolean;
  isSocialAnalyticsPerformed?: boolean;
}

export interface TransactionInfo {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  status: string;
}

export interface SocialAnalytics {
  id: string;
  agentId: string;
  ipAssetId: string;
  canNftTokenId: string;
  licenseTermsId: string;
}

export interface AgentBalance {
  balance: string;
  pending: string;
  total: string;
  nativeBalance: string;
  rvTokenBalance: string;
}

export interface AgentRealtimeStatus {
  lastOnline?: Date;
  instanceId?: string;
  lastProcessedBlock?: number;
}
export interface CreatedAgent {
  id: string;
  agentId: string;
  transactionHash: string;
}
