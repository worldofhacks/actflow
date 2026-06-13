import { getUserRoleFromCookies } from '@/actions/role';
import { getMyAgents } from '@/lib/service/agentService';
import { getAllUserWalletsInfo } from '@/lib/service/wallet.service';
import { TaskDetails } from '@/types/tasks/task-details.response';
import Link from 'next/link';
import { Button } from '../../../../../../../components/ui/button';
import { TaskDescription } from '../shared/task-description';
import { TaskHeader } from '../shared/task-header';
import { TaskResultData } from '../shared/task-result-data';
import { TaskSidebar } from '../shared/task-sidebar';
import { TaskTransactions } from '../shared/task-transactions';
import AssignAgentToTaskDialogTrigger from './assign-agent-to-task-dialog-trigger';

export default async function SellerTaskView({ task }: { task: TaskDetails }) {
  const userWalletsResponse = await getAllUserWalletsInfo();
  const userWallets = userWalletsResponse.data || [];
  const userRole = await getUserRoleFromCookies();
  const myAgents = await getMyAgents();

  const myAgentAssigned = myAgents.data?.find(agent => agent.agentId === task.assignedAgent);
  const invitedAgentsWallets = new Set(
    task.invitedAgents.map(agent => agent.agentId.toLowerCase()),
  );
  const myInvitedAgents = myAgents.data?.filter(agent =>
    invitedAgentsWallets.has(agent.agentId.toLowerCase()),
  );

  return (
    <div>
      <TaskHeader task={task} userRole={userRole} userWallets={userWallets} />

      {myAgentAssigned ? (
        <div className="mb-4">
          <Link className="w-fit mb-2" href={`/tasks/${task.taskId}/submit`}>
            <Button className="mb-4">Submit task result</Button>
          </Link>
          <p className="text-sm text-gray-500">
            Your agent{' '}
            <Link href={`/agents/${myAgentAssigned.agentId}`}>
              <Button variant="link" className="p-0 text-sm">
                {' ' + myAgentAssigned.metadata?.name + ' '}
              </Button>
            </Link>{' '}
            is assigned to this task. Please submit your task to the buyer once it is completed.
          </p>
        </div>
      ) : myInvitedAgents && myInvitedAgents.length > 0 ? (
        <div className="mb-4">
          <AssignAgentToTaskDialogTrigger
            availableAgents={myInvitedAgents}
            taskReward={task.reward}
            taskExecutionDuration={task.executionDuration!}
          />
          <div className="mb-1 mt-2 gap-x-2 flex">
            <p className="text-sm text-gray-500">
              {myInvitedAgents.length} of your agents are invited to this task. Please assign one of
              them to the task.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main info - spans 2 columns on md screens */}
        <div className="md:col-span-2 space-y-6">
          <TaskDescription task={task} />
          <TaskTransactions task={task} />
          <TaskResultData task={task} />
        </div>

        {/* Sidebar - right column */}
        <TaskSidebar task={task} />
      </div>
    </div>
  );
}
