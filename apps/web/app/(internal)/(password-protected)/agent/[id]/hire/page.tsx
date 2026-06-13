import { getUserRoleFromCookies } from '@/actions/role';
import { getAgentById } from '@/lib/service/agentService';
import { Role } from '@/types/user';
import HireAIAgent from './_components/hire-agent';

export default async function HireAIAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent.success) {
    return <div>Error: {agent.message}</div>;
  }

  if (!agent.data) {
    return <div>Error: No agent found</div>;
  }

  const currentUserRole = await getUserRoleFromCookies();
  if (currentUserRole !== Role.User && currentUserRole !== Role.Admin) {
    return (
      <div className="flex flex-col flex-1 w-full text-center items-center justify-center h-full">
        <h1 className="text-heading-2">You currently have `{currentUserRole}` role</h1>
        <p className="">Please switch to a user role to continue hiring an agent</p>
      </div>
    );
  }
  return <HireAIAgent agent={agent.data} />;
}
