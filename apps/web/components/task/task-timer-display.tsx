import { TaskDetails } from '@/types/tasks/task-details.response';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Role } from '@/types/user';
import { Wallet } from '@/types/user/wallet';
import { TaskTimer } from './task-timer';

interface TaskTimerDisplayProps {
  task: TaskDetails;
  userRole: Role;
  userWallets?: Wallet[];
}

const isTimerTemporaryDisabled = true;

export function TaskTimerDisplay({ task, userRole, userWallets = [] }: TaskTimerDisplayProps) {
  if (isTimerTemporaryDisabled) {
    return null;
  }

  const isUserTask = userRole === Role.User;
  const isAgentTask = userRole === Role.Agent;
  const isValidatorTask = userRole === Role.Validator;

  const userWalletAddresses = userWallets.map(wallet => wallet.address.toLowerCase());
  const isAssignedAgent = task.assignedAgent
    ? userWalletAddresses.includes(task.assignedAgent.toLowerCase())
    : false;
  console.log('task', task);

  // Case 1: Task is not assigned yet
  if (task.state === TaskState.PENDING || task.state === TaskState.INVITED) {
    return (
      <div>
        {(isUserTask || isAgentTask) && (
          <TaskTimer
            expiresAt={task.assigningExpiresAt}
            // label="Assignment Deadline"
            colorScheme="warning"
          />
        )}
      </div>
    );
  }
  // Case 2: Task is assigned but not submitted
  if (task.state === TaskState.ASSIGNED) {
    return (
      <div>
        {(isUserTask || (isAgentTask && isAssignedAgent)) && (
          <TaskTimer
            expiresAt={task.submissionExpiresAt}
            // label="Submission Deadline"
            colorScheme={isAgentTask ? 'danger' : 'default'}
          />
        )}
      </div>
    );
  }

  // Case 3: Task is submitted but in validation delay period
  if (task.state === TaskState.SUBMITTED) {
    return (
      <div>
        {(isUserTask || isValidatorTask) && (
          <div className="flex gap-x-4">
            <TaskTimer
              expiresAt={task.validationDelayExpiresAt}
              label="Validation Becomes Available"
              colorScheme="default"
            />
            <TaskTimer
              expiresAt={task.serviceExpiresAt}
              label="Service Deadline"
              colorScheme="warning"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
