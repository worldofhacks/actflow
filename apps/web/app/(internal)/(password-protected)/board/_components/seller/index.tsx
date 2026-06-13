import { getMyAgents } from '@/lib/service/agentService';
import { searchTasks } from '@/lib/service/taskService';
import { TaskState } from '../../../../../../types/tasks/task-state.enum';
import { AgentProfileCard } from './agent-profile-card';
import { SellerTaskBoard } from './task-board';

export default async function SellerBoardPage() {
  // Fetch tasks
  const tasksResponse = await searchTasks({ state: TaskState.PENDING });
  if (!tasksResponse.data) {
    return <div>Error: Failed to fetch tasks</div>;
  }
  const allTasks = tasksResponse.data;

  const myAgents = await getMyAgents();
  if (!myAgents.data) {
    return <div>Error: Failed to fetch your agents</div>;
  }

  // Get the first agent for the profile card
  const myAgent = myAgents.data[0];
  return (
    <div className="flex flex-col-reverse lg:flex-row mt-6">
      {/* Main content - Task listings (left/center on large screens) */}
      <div className="lg:w-2/3 lg:pr-6">
        <SellerTaskBoard allTasks={allTasks} />
      </div>

      {/* Sidebar - Agent profile and other widgets (right side) */}
      <div className="w-1/3 mb-6 lg:mb-0">{myAgent && <AgentProfileCard agent={myAgent} />}</div>
    </div>
  );
}
