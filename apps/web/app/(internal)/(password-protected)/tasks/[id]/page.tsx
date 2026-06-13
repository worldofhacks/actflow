import { getUserRoleFromCookies } from '@/actions/role';
import { getTaskById } from '@/lib/service/taskService';
import { getAllUserWalletsInfo } from '@/lib/service/wallet.service';
import { Role } from '@/types/user';
import { UserTaskView } from './_components/buyer';
import { SellerTaskView } from './_components/seller';
import { ValidatorTaskView } from './_components/validator';

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [taskResponse, userWalletsResponse, userRole] = await Promise.all([
    getTaskById(id),
    getAllUserWalletsInfo(),
    getUserRoleFromCookies(),
  ]);

  if (!taskResponse.data) {
    return <div>Error: {taskResponse.error}</div>;
  }
  const task = taskResponse.data;
  const userWallets = userWalletsResponse.data || [];

  if (userRole === Role.User) {
    return <UserTaskView task={task} userWallets={userWallets} />;
  } else if (userRole === Role.Agent) {
    return <SellerTaskView task={task} />;
  } else if (userRole === Role.Validator) {
    return <ValidatorTaskView task={task} userWallets={userWallets} />;
  } else {
    return <div>No task view available for your role</div>;
  }
}
