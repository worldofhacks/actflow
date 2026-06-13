// task-state-machine.ts
import { TaskState } from '../../../contracts';
import { Types } from 'mongoose';
type ObjectId = Types.ObjectId;
import { TaskService } from '../../../task/services/task.service';

export const validTaskTransitions = {
  [TaskState.PENDING]: [TaskState.ASSIGNED, TaskState.INVITED, TaskState.DELETED],
  [TaskState.INVITED]: [TaskState.ASSIGNED, TaskState.DELETED],
  [TaskState.ASSIGNED]: [TaskState.SUBMITTED, TaskState.DELETED],
  [TaskState.SUBMITTED]: [
    TaskState.COMPLETED,
    TaskState.VALIDATED,
    TaskState.DECLINED_BY_OWNER,
    TaskState.DECLINED_BY_VALIDATOR,
  ],
  [TaskState.VALIDATED]: [TaskState.DISPUTED_BY_OWNER],
  [TaskState.DECLINED_BY_OWNER]: [TaskState.DISPUTED_BY_AGENT],
  [TaskState.DECLINED_BY_VALIDATOR]: [TaskState.DISPUTED_BY_AGENT],
  [TaskState.DISPUTED_BY_OWNER]: [TaskState.RESOLVED],
  [TaskState.DISPUTED_BY_AGENT]: [TaskState.RESOLVED],
  [TaskState.COMPLETED]: [],
  [TaskState.RESOLVED]: [],
  [TaskState.DELETED]: [],
};

export function isValidTaskTransition(
  from: TaskState,
  to: TaskState,
  isHistorical = false,
): boolean {
  if (isHistorical) return true;
  if (from === to) return true;
  return validTaskTransitions[from]?.includes(to) || false;
}

export async function enforceTaskStateTransition(
  taskService: TaskService,
  mongoTaskId: ObjectId,
  newState: TaskState,
  isHistorical: boolean,
): Promise<void> {
  if (isHistorical) return;

  const task = await taskService.findById(mongoTaskId);
  if (!task) return; // New task

  if (!isValidTaskTransition(task.state, newState)) {
    throw new Error(`Invalid task state transition from ${task.state} to ${newState}`);
  }
}
