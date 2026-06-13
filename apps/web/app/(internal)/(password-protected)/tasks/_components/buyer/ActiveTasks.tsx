import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Eye, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardInner,
  CardTitle,
} from '../../../../../../components/ui/card';
import { searchTasks } from '../../../../../../lib/service/taskService';
import { getAllUserWalletsInfo } from '../../../../../../lib/service/wallet.service';
import { TaskDetails } from '../../../../../../types/tasks/task-details.response';
import AgentLink from './AgentLink';

// Helper function to get color based on task state
const getStateColor = (state: TaskState) => {
  switch (state) {
    case TaskState.PENDING:
    case TaskState.INVITED:
      return 'text-act-gold'; // Yellow/gold for pending states
    case TaskState.ASSIGNED:
      return 'text-act-turquoise'; // Turquoise for active/running states
    case TaskState.SUBMITTED:
      return 'text-act-turquoise'; // Turquoise for active/running states
    case TaskState.COMPLETED:
      return 'text-green-400'; // Green for completed
    case TaskState.DISPUTED_BY_AGENT || TaskState.DISPUTED_BY_OWNER:
      return 'text-red-400'; // Red for dispute
    case TaskState.EXPIRED:
      return 'text-gray-400'; // Gray for expired
    default:
      return 'text-act-turquoise';
  }
};

// Helper function to get state display text
const getStateText = (state: TaskState) => {
  switch (state) {
    case TaskState.PENDING:
      return 'Pending';
    case TaskState.INVITED:
      return 'Pending Agent Invitation';
    case TaskState.ASSIGNED:
      return 'Assigned';
    case TaskState.SUBMITTED:
      return 'Submitted | Awaiting Approval';
    case TaskState.DISPUTED_BY_AGENT || TaskState.DISPUTED_BY_OWNER:
      return 'In Dispute';
    case TaskState.COMPLETED:
      return 'Completed';
    case TaskState.DELETED:
      return 'Deleted';
    case TaskState.RESOLVED:
      return 'Resolved';
    default:
      return 'Unknown';
  }
};

// Task Card Component
const TaskCard = ({ task }: { task: TaskDetails }) => {
  const stateColor = getStateColor(task.state);
  const stateText = getStateText(task.state);
  return (
    <CardInner key={task.taskId}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 lg:mb-4">
        <div>
          <h3 className="text-white font-medium">{task.metadata?.serviceName}</h3>
          <div className="flex gap-2 items-center flex-wrap mt-1">
            <span className={`${stateColor} text-sm`}>{stateText}</span>
            <AgentLink agentAddress={task.assignedAgent || ''} taskState={task.state} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-3 lg:mt-0">
          <Link href={`/tasks/${task.taskId}`}>
            <Button size="sm" variant="ghost" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          {task.assignedAgent && (
            <Link href={`/agent/${task.assignedAgent}`}>
              <Button size="sm" variant="ghost" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                View Agent
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Show budget for all states */}
      <div className="text-sm">
        <span className="text-gray-400">Budget Allocation:</span>
        <span className="text-act-gold ml-2">${task.metadata?.basePrice || '0'}</span>
        {task.state === TaskState.ASSIGNED && <span className="text-gray-400 ml-1">of $700</span>}
      </div>
    </CardInner>
  );
};

const renderEmptyState = (message: string = 'No tasks found') => (
  <div className="text-center text-gray-400 py-8">
    <p>{message}</p>
  </div>
);

export async function ActiveTasks() {
  const { data: walletInfo } = await getAllUserWalletsInfo();
  const { data: tasks } = walletInfo
    ? await searchTasks({
        creatorWallets: walletInfo?.map(wallet => wallet.address),
      })
    : { data: [] };

  // Group tasks by their state
  const assignedTasks = tasks
    ? tasks.filter(task => task.state === TaskState.ASSIGNED || task.state === TaskState.SUBMITTED)
    : [];
  const completedTasks = tasks
    ? tasks.filter(task => task.state === TaskState.COMPLETED || task.state === TaskState.RESOLVED)
    : [];
  const disputedTasks = tasks
    ? tasks.filter(
        task =>
          task.state === TaskState.DISPUTED_BY_AGENT || task.state === TaskState.DISPUTED_BY_OWNER,
      )
    : [];
  const reviewTasks = tasks ? tasks.filter(task => task.state === TaskState.SUBMITTED) : [];
  const pendingTasks = tasks
    ? tasks.filter(task => task.state === TaskState.PENDING || task.state === TaskState.INVITED)
    : [];

  return (
    <Card className="lg:col-span-2 space-y-4 lg:space-y-6">
      <CardHeader>
        <CardTitle>AI Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger className="w-full" value="assigned">
              Assigned ({assignedTasks.length})
            </TabsTrigger>
            <TabsTrigger className="w-full" value="review">
              On Review ({reviewTasks.length})
            </TabsTrigger>
            <TabsTrigger className="w-full" value="disputed">
              Disputed ({disputedTasks.length})
            </TabsTrigger>
            <TabsTrigger className="w-full" value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
            <TabsTrigger className="w-full" value="pending">
              Pending ({pendingTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-3 lg:space-y-4">
            {assignedTasks.length > 0
              ? assignedTasks.map(task => <TaskCard task={task} key={task.taskId} />)
              : renderEmptyState('No assigned tasks')}
          </TabsContent>

          <TabsContent value="review" className="space-y-3 lg:space-y-4">
            {reviewTasks.length > 0
              ? reviewTasks.map(task => <TaskCard task={task} key={task.taskId} />)
              : renderEmptyState('No tasks under review')}
          </TabsContent>

          <TabsContent value="disputed" className="space-y-3 lg:space-y-4">
            {disputedTasks.length > 0
              ? disputedTasks.map(task => <TaskCard task={task} key={task.taskId} />)
              : renderEmptyState('No disputed tasks')}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 lg:space-y-4">
            {completedTasks.length > 0
              ? completedTasks.map(task => <TaskCard task={task} key={task.taskId} />)
              : renderEmptyState('No completed tasks')}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 lg:space-y-4">
            {pendingTasks.length > 0
              ? pendingTasks.map(task => <TaskCard task={task} key={task.taskId} />)
              : renderEmptyState('No pending tasks')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// implemented with animate-pulse
export async function ActiveTasksSkeleton() {
  return (
    <div className="lg:col-span-2 space-y-4 lg:space-y-6">
      <div className="bg-act-surface border border-act-border rounded-xl p-4 lg:p-6">
        <div className="mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold text-white">AI Tasks</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-act-elevated border flex rounded-lg border-act-border overflow-hidden w-full h-10 animate-pulse">
            {[1, 2, 3, 4, 5].map(item => (
              <div key={item} className="flex-1 h-full"></div>
            ))}
          </div>

          {/* Tasks List Skeleton */}
          <div className="space-y-3 lg:space-y-4">
            {[1, 2, 3].map(item => (
              <div key={item} className="bg-act-base-dark rounded-lg p-3 lg:p-4 animate-pulse">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 lg:mb-4">
                  <div>
                    <div className="h-5 w-40 bg-act-elevated rounded mb-2"></div>
                    <div className="h-4 w-32 bg-act-elevated rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3 lg:mt-0">
                    <div className="h-9 w-28 bg-act-elevated rounded"></div>
                    <div className="h-9 w-28 bg-act-elevated rounded"></div>
                  </div>
                </div>

                <div className="text-sm mt-2">
                  <div className="h-3 w-32 bg-act-elevated rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
