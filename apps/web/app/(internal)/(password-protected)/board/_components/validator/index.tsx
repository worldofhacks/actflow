import { searchTasks } from '@/lib/service/taskService';
import { ValidatorTaskBoard } from './task-board';

export default async function ValidatorBoardPage() {
  const tasksResponse = await searchTasks({
    validationEligible: true,
  });

  if (!tasksResponse.data) {
    return <div>Error: Failed to fetch tasks</div>;
  }

  return <ValidatorTaskBoard tasks={tasksResponse.data} />;
}
