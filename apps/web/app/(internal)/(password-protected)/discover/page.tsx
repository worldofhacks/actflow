import { AgentType } from '@/types/agent/agent-type';
import { TopicTypeEnum } from '@/types/TopicTypeEnum';
import { DiscoverAgents } from './_components';

export default async function DiscoverAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    topic?: TopicTypeEnum;
    serviceType?: string;
    minBudget?: string;
    maxBudget?: string;
    profileType?: AgentType;
    name?: string;
    isValid?: boolean;
  }>;
}) {
  return <DiscoverAgents searchParams={searchParams} />;
}
