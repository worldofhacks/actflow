import { TransactionHistoryItem } from '../../../core/types';
import { TaskSummaryApiResponse } from '../../../task/types/response/task-details.response';
import { AgentTopicSkill } from '../../core/agent-topic';
import {
  AgentRealtimeStatusDocument,
  SocialAnalyticsDocument,
} from '../../schemas/agent-analytics.schema';
import { AgentMetadataResponse } from './agent-metadata.response';
import { AgentStatisticsResponse } from './agent-statistics.response';

export class AgentDetailsApiResponse {
  id: string;
  agentId: string;
  ipAssetId?: string;
  canNftTokenId?: string;
  licenseTermsId?: string;
  fee?: string;
  topic?: string;
  skills?: AgentTopicSkill[];
  executionDuration?: string;

  socialAnalytics?: SocialAnalyticsDocument; //TODO: in future create other dto type for analytics response
  realtimeStatus?: AgentRealtimeStatusDocument; //TODO: in future create other dto type for realtime status response
  metadata?: AgentMetadataResponse;
  statistics?: AgentStatisticsResponse;
  tasks?: TaskSummaryApiResponse[];

  isSocialAnalyticsPerformed?: boolean;
  isPaused?: boolean;
  autoAssign?: boolean;
  isDeleted?: boolean;
  isBlockchainConfirmed?: boolean;
  isFeatured?: boolean;
  relatedTransactions?: TransactionHistoryItem[];
  balance?: AgentBalanceApiResponse;
}

export class AgentBalanceApiResponse {
  balance: string;
  pending: string;
  total: string;
  nativeBalance: string;
  rvTokenBalance: string;
}
