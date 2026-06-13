import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { Wallet } from '@/types/user/wallet';
import { TaskTimerDisplay } from '../../../../../../../components/task/task-timer-display';
import { Role } from '../../../../../../../types/user';
import { getTaskStateLabel } from '../../_utils';

export function TaskHeader({
  task,
  userRole,
  userWallets,
}: {
  task: TaskDetails;
  userRole: Role;
  userWallets: Wallet[];
}) {
  const stateInfo = getTaskStateLabel(task.state);

  return (
    <PageHeader>
      <PageHeaderTitle className="justify-between flex items-center w-full">
        {task.metadata?.serviceName || `Task #${task.taskId}`}
      </PageHeaderTitle>
      <PageHeaderDescription>
        <div className={`${stateInfo.color} flex gap-x-4 items-center`}>
          <div className="flex gap-x-2 items-center">
            {stateInfo.icon}
            <span className="ml-1">{stateInfo.label}</span>
          </div>
          <TaskTimerDisplay task={task} userRole={userRole} userWallets={userWallets} />
        </div>
      </PageHeaderDescription>
    </PageHeader>
  );
}
