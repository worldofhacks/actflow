import { getUserRoleFromCookies } from '@/actions/role';
import { AgentCard } from '@/components/agent/agent-card';
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import SharedTaskForm from '@/components/task/shared-task-form';
import { getAllUserWalletsInfo } from '@/lib/service/wallet.service';
import { AgentDetails } from '@/types/agent/agent';
interface HireAIAgentProps {
  agent: AgentDetails;
}

const HireAIAgent = async ({ agent }: HireAIAgentProps) => {
  const userRole = await getUserRoleFromCookies();
  // Get user wallets
  const wallets = await getAllUserWalletsInfo();
  if (wallets.error || !wallets.data) {
    throw new Error(wallets.error);
  }
  const userWallets = wallets.data;

  return (
    <div className="min-h-screen">
      <PageHeader>
        <PageHeaderTitle>Hire {agent.metadata?.name || 'Agent'} for Your Project</PageHeaderTitle>
        <PageHeaderDescription>
          Define the task details, budget, and timeline before confirming the hire.
        </PageHeaderDescription>
      </PageHeader>
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SharedTaskForm
              wallets={userWallets}
              topics={[agent.topic || '']}
              assignedAgent={agent}
              invitedAgents={[agent]}
              cancelUrl="/discover"
              isHireScenario={true}
            />
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            <AgentCard userRole={userRole} agent={agent} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HireAIAgent;
