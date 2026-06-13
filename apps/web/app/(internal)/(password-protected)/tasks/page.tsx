import { Role } from '@/types/user';
import { getUserRoleFromCookies } from '../../../../actions/role';
import { BuyerTasks } from './_components/buyer';
import { SellerTasks } from './_components/seller';

export default async function TasksPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const userRole = await getUserRoleFromCookies();
  const searchParams = await searchParamsPromise;
  if (userRole === Role.User) {
    return <BuyerTasks />;
  } else if (userRole === Role.Agent) {
    return <SellerTasks selectedAgentId={searchParams.agent} />;
  } else {
    return <div>Unauthorized</div>;
  }
}
