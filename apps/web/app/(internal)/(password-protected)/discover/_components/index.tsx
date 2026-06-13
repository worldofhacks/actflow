import { getUserRoleFromCookies } from '@/actions/role';
import { agentFilterRequestSchema } from '@/types/agent/agent-filter';
import { Role } from '@/types/user';
import { searchAgents } from '../../../../../lib/service/agentService';
import { getTopics } from '../../../../../lib/service/staticService';
import { BuyerDiscoverAgents } from './buyer';
import { SellerDiscoverAgents } from './seller';

const accessRoles = [Role.User, Role.Agent];

export const DiscoverAgents = async ({
  searchParams,
}: {
  searchParams: Promise<{
    topic?: string;
    serviceType?: string;
    minBudget?: string;
    maxBudget?: string;
    profileType?: string;
    name?: string;
    isValid?: boolean;
  }>;
}) => {
  const currentUserRole = await getUserRoleFromCookies();

  if (!accessRoles.includes(currentUserRole)) {
    return <div>You are not authorized to access this page</div>;
  }

  const filters = await agentFilterRequestSchema.safeParseAsync(await searchParams);
  const filtersData = filters.success ? filters.data : {};

  const errors = filters.error;
  if (errors) {
    console.error(errors);
  }

  const [agentsResponse, topicsResponse] = await Promise.all([
    searchAgents({ ...filtersData, isValid: !!filtersData.isValid }),
    getTopics(),
  ]);

  if (agentsResponse.error || topicsResponse.error) {
    console.error('Error fetching agents or topics', agentsResponse.error, topicsResponse.error);
  }
  return (
    <>
      {errors && <div className="text-red-500">{errors.message}</div>}
      {currentUserRole === Role.User && (
        <BuyerDiscoverAgents
          allAgents={agentsResponse.data ?? []}
          featuredAgents={agentsResponse.data ?? []}
          topics={topicsResponse.data ?? []}
          filters={filtersData}
          userRole={currentUserRole}
        />
      )}
      {currentUserRole === Role.Agent && (
        <SellerDiscoverAgents
          filters={filtersData}
          topics={topicsResponse.data ?? []}
          featuredAgents={agentsResponse.data ?? []}
          allAgents={agentsResponse.data ?? []}
        />
      )}
    </>
  );
};
