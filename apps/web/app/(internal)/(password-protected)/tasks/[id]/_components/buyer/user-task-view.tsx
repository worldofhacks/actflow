import { getUserRoleFromCookies } from '@/actions/role';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Wallet } from '@/types/user/wallet';
import { TaskDescription } from '../shared/task-description';
import { TaskHeader } from '../shared/task-header';
import { TaskResultData } from '../shared/task-result-data';
import { TaskSidebar } from '../shared/task-sidebar';
import { TaskTransactions } from '../shared/task-transactions';
import ApproveResultDialog from './approve-result-dialog-trigger-button';
import DeclineResultDialog from './decline-result-dialog-trigger-button';

export default async function UserTaskView({
  task,
  userWallets,
}: {
  task: TaskDetails;
  userWallets: Wallet[];
}) {
  const creatorWallet = userWallets.find(wallet => wallet.address === task.creator);
  const showActionButtons = task.state === TaskState.SUBMITTED && !!creatorWallet;
  const userRole = await getUserRoleFromCookies();

  return (
    <div>
      <TaskHeader userRole={userRole} userWallets={userWallets} task={task} />

      {/* Action Buttons */}
      {showActionButtons && (
        <div className="flex gap-3 mb-6">
          <ApproveResultDialog
            taskName={task.metadata?.serviceName || `Task #${task.taskId}`}
            walletAddress={creatorWallet?.address}
            taskId={task.taskId}
            taskResult={task.resultData || ''}
          />
          <DeclineResultDialog
            taskResult={task.resultData || ''}
            taskName={task.metadata?.serviceName || `Task #${task.taskId}`}
            walletAddress={creatorWallet?.address}
            taskId={task.taskId}
          />
        </div>
      )}

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
