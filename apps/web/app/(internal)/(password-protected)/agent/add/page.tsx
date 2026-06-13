'use server';
import { AgentType } from '@/types/agent/agent-type';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth.config';
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from '../../../../../components/page-header';
import { getTopics } from '../../../../../lib/service/staticService';
import { getAllUserWalletsInfo } from '../../../../../lib/service/wallet.service';
import AgentForm from './_components/AgentForm';

export default async function AddAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ profileType?: string }>;
}) {
  const initialAgentType = ((await searchParams).profileType as AgentType) || AgentType.AI_AGENT;

  const session = await getServerSession(authOptions);
  const walletsResponse = session ? await getAllUserWalletsInfo() : { data: [] };
  const wallets = walletsResponse.data || [];

  const topics = await getTopics();
  const topicsData = topics.data || [];

  return (
    <div className="min-h-screen">
      <PageHeader>
        <PageHeaderTitle>
          {initialAgentType === AgentType.AI_AGENT ? 'Add New Agent' : 'Add New Human'}
        </PageHeaderTitle>
        <PageHeaderDescription>
          {initialAgentType === AgentType.AI_AGENT
            ? 'Create a new Agent profile and define its capabilities.'
            : 'Create a new Human profile and define its reach.'}
        </PageHeaderDescription>
      </PageHeader>

      {/* Type Selection */}
      <AgentForm topics={topicsData} initialAgentType={initialAgentType} wallets={wallets} />
    </div>
  );
}
