import { getUserRoleFromCookies } from '@/actions/role';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Wallet } from '@/types/user/wallet';
import { ApproveResultDialogTriggerButton, DeclineResultDialogTriggerButton } from '.';
import { getMyValidators } from '../../../../../../../lib/service/validatorService';
import { TaskDescription } from '../shared/task-description';
import { TaskHeader } from '../shared/task-header';
import { TaskResultData } from '../shared/task-result-data';
import { TaskSidebar } from '../shared/task-sidebar';
import { TaskTransactions } from '../shared/task-transactions';

export default async function ValidatorTaskView({
  task,
  userWallets,
}: {
  task: TaskDetails;
  userWallets: Wallet[];
}) {
  const validatorWallet = userWallets.find(wallet => wallet.address === task.assignedValidator);
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const showValidateButton =
    task.state === TaskState.SUBMITTED &&
    (task.assignedValidator === zeroAddress || !!validatorWallet);

  const validatorWalletsResponse = (await getMyValidators()).data;
  const userRole = await getUserRoleFromCookies();

  const availableValidatorWallets = userWallets.filter(wallet =>
    validatorWalletsResponse?.some(
      validator => validator.validatorId.toLowerCase() === wallet.address.toLowerCase(),
    ),
  );

  return (
    <div>
      <TaskHeader task={task} userRole={userRole} userWallets={userWallets} />

      {showValidateButton && (
        <div className="flex gap-3 mb-6">
          <ApproveResultDialogTriggerButton
            taskName={task.metadata?.serviceName || `Task #${task.taskId}`}
            availableValidatorsWallets={availableValidatorWallets}
            userHasWallets={userWallets.length > 0}
            taskId={task.taskId}
            taskResult={task.resultData || ''}
          />
          <DeclineResultDialogTriggerButton
            taskName={task.metadata?.serviceName || `Task #${task.taskId}`}
            availableValidatorsWallets={availableValidatorWallets}
            userHasWallets={userWallets.length > 0}
            taskId={task.taskId}
            taskResult={task.resultData || ''}
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
