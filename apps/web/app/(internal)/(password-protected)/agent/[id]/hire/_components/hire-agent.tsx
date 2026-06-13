import { getUserRoleFromCookies } from '@/actions/role';
import { AgentCard } from '@/components/agent/agent-card';
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import SharedTaskForm from '@/components/task/shared-task-form';
import { getAllUserWalletsInfo } from '@/lib/service/wallet.service';
import { AgentDetails } from '@/types/agent/agent';
import { HireFlow } from './hire-flow';

interface HireAIAgentProps {
  agent: AgentDetails;
}

/**
 * Hire surface for an agent.
 *
 * The primary path is the hire -> pay -> receipt flow (HireFlow): World free
 * trial OR x402 USDC payment on Arc, then a receipt + live task status. The
 * existing "define a task" form is kept as a secondary step (the footer slot) so
 * a buyer can spec a concrete task; the AgentCard sits in the sidebar.
 */
const HireAIAgent = async ({ agent }: HireAIAgentProps) => {
  const userRole = await getUserRoleFromCookies();
  // Get user wallets (used by the task-definition form below).
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
          Pay per task in USDC on Arc — or use a free World ID run — then track the task to its
          receipt.
        </PageHeaderDescription>
      </PageHeader>

      <div className="w-full">
        <HireFlow
          agent={agent}
          sidebarTop={<AgentCard userRole={userRole} agent={agent} />}
          footer={
            <div id="hire-task-form" className="space-y-2">
              <h2 className="font-onest text-lg font-semibold text-white">Define a custom task</h2>
              <p className="text-sm text-muted-foreground">
                Optionally spec the task details, budget and timeline for this agent.
              </p>
              <SharedTaskForm
                wallets={userWallets}
                topics={[agent.topic || '']}
                assignedAgent={agent}
                invitedAgents={[agent]}
                cancelUrl="/discover"
                isHireScenario={true}
              />
            </div>
          }
        />
      </div>
    </div>
  );
};

export default HireAIAgent;
