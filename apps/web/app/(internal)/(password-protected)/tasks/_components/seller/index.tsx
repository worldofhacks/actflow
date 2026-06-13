import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardInner, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMyAgents } from '@/lib/service/agentService';
import { searchTasks } from '@/lib/service/taskService';
import { AgentDetails } from '@/types/agent/agent';
import { TaskState } from '@/types/tasks/task-state.enum';
import {
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Info,
  MessageSquare,
  Plus,
  Scale,
  Send,
  Shield,
  Star,
  Upload,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { TaskDetails } from '../../../../../../types/tasks/task-details.response';
import { formatReward } from '../../_utils/formatReward';
import { AgentSelector } from './agent-selector';

interface TaskCategories {
  pending: TaskDetails[];
  invited: TaskDetails[];
  assigned: TaskDetails[];
  disputed: TaskDetails[];
  completed: TaskDetails[];
  submitted: TaskDetails[];
  deleted: TaskDetails[];
  expired: TaskDetails[];
  resolved: TaskDetails[];
}

const categorizeTasks = (tasksData: TaskDetails[] = []): TaskCategories => {
  const initialCategories: TaskCategories = {
    pending: [],
    invited: [],
    assigned: [],
    disputed: [],
    completed: [],
    submitted: [],
    deleted: [],
    expired: [],
    resolved: [],
  };

  return tasksData.reduce((acc, task) => {
    switch (task.state) {
      case TaskState.PENDING:
        acc.pending.push(task);
        break;
      case TaskState.INVITED:
        acc.invited.push(task);
        break;
      case TaskState.ASSIGNED:
        acc.assigned.push(task);
        break;
      case TaskState.DISPUTED_BY_AGENT || TaskState.DISPUTED_BY_OWNER:
        acc.disputed.push(task);
        break;
      case TaskState.COMPLETED:
        acc.completed.push(task);
        break;
      case TaskState.SUBMITTED:
        acc.submitted.push(task);
        break;
      case TaskState.DELETED:
        acc.deleted.push(task);
        break;
      case TaskState.EXPIRED:
        acc.expired.push(task);
        break;
      case TaskState.RESOLVED:
        acc.resolved.push(task);
        break;
    }
    return acc;
  }, initialCategories);
};

export const SellerTasks = async ({ selectedAgentId }: { selectedAgentId?: string }) => {
  const myAgents = await getMyAgents();
  if (!myAgents.data) return null;
  const myAgentsIds = myAgents.data.map(agent => agent.id);
  const tasks = await searchTasks({
    invitedAgents: myAgentsIds,
    assignedAgents: myAgentsIds,
  });
  const invitedAgents = myAgents.data;

  const tasksData = tasks.data || [];
  const categories = categorizeTasks(tasksData);

  // Group tasks for displays and counts
  const assignedTasks = [...categories.assigned];
  const invitationTasks = [...categories.pending, ...categories.invited];
  const completedTasks = [...categories.completed];
  const submittedTasks = [...categories.submitted];
  const disputedTasks = [...categories.disputed];
  const otherTasks = [...categories.deleted, ...categories.expired, ...categories.resolved];

  // For stat displays
  const lastAssignedTask = assignedTasks.length > 0 ? assignedTasks[0] : null;
  const lastDeclinedTask =
    [...categories.deleted, ...categories.expired].length > 0
      ? [...categories.deleted, ...categories.expired][0]
      : null;

  return (
    <div className="min-h-screen">
      <PageHeader>
        <PageHeaderTitle>Manage Your AI Job Requests</PageHeaderTitle>
        <PageHeaderDescription>
          Review, accept, or negotiate job offers from AI buyers.
        </PageHeaderDescription>
      </PageHeader>

      {/* Agent Selector */}
      <AgentSelector agents={myAgents.data} selectedAgentId={selectedAgentId} />

      <div className="w-full mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:hidden ">
            <CardContent>
              {/* Mobile Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <CardInner>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-act-2-gray-medium text-sm">Assigned to Me</span>
                    <span className="text-act-2-purple-light font-medium">
                      {assignedTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-act-2-gray-medium">
                    <Clock className="h-4 w-4 mr-1 text-act-2-purple-light" />
                    In Progress
                  </div>
                </CardInner>
                <CardInner>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-act-2-gray-medium text-sm">Invitations</span>
                    <span className="text-act-2-gray-light font-medium">
                      {invitationTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-act-2-gray-medium">
                    <AlertTriangle className="h-4 w-4 mr-1 text-act-2-gray-light" />
                    Need Action
                  </div>
                </CardInner>
              </div>
              {/* Mobile Quick Actions */}
              <div className="lg:hidden flex overflow-x-auto scrollbar-hide justify-between items-center space-x-3 mt-4">
                <Button className="whitespace-nowrap w-full">
                  <span className="flex items-center px-4">
                    <Plus className="h-4 w-4 mr-2" />
                    New Job
                  </span>
                </Button>
                <Button className="whitespace-nowrap w-full" variant={'secondary'}>
                  <span className="flex items-center px-4">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Jobs
                  </span>
                </Button>
                <Button className="whitespace-nowrap w-full" variant={'secondary'}>
                  <span className="flex items-center px-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabbed Tasks View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center w-full">
                  All Tasks
                  <Link
                    href="/tasks/progress"
                    className="text-act-2-purple hover:text-act-2-purple-light text-sm font-medium flex items-center"
                  >
                    View History
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="invitations" className="w-full">
                  <TabsList className="w-full mb-4 flex justify-start overflow-x-auto">
                    <TabsTrigger value="invitations">
                      Invitations ({invitationTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="assigned">
                      Assigned to Me ({assignedTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="submitted">Submitted ({submittedTasks.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
                    <TabsTrigger value="disputed">Disputed ({disputedTasks.length})</TabsTrigger>
                    <TabsTrigger value="other">Other ({otherTasks.length})</TabsTrigger>
                  </TabsList>

                  {/* Invitations Tasks Tab */}
                  <TabsContent value="invitations" className="space-y-4">
                    {invitationTasks.length > 0 ? (
                      invitationTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          myAgents={invitedAgents}
                          type="invitation"
                        />
                      ))
                    ) : (
                      <p className="text-act-2-gray-medium text-center py-4">
                        No invitations at the moment
                      </p>
                    )}
                  </TabsContent>

                  {/* Assigned Tasks Tab */}
                  <TabsContent value="assigned" className="space-y-4">
                    {assignedTasks.length > 0 ? (
                      assignedTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          myAgents={invitedAgents}
                          type="assigned"
                        />
                      ))
                    ) : (
                      <p className="text-act-2-gray-medium text-center py-4">
                        No assigned tasks at the moment
                      </p>
                    )}
                  </TabsContent>

                  {/* Submitted Tasks Tab */}
                  <TabsContent value="submitted" className="space-y-4">
                    {submittedTasks.length > 0 ? (
                      submittedTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          myAgents={invitedAgents}
                          type="submitted"
                        />
                      ))
                    ) : (
                      <p className="text-act-2-gray-medium text-center py-4">
                        No submitted tasks at the moment
                      </p>
                    )}
                  </TabsContent>

                  {/* Completed Tasks Tab */}
                  <TabsContent value="completed" className="space-y-4">
                    {completedTasks.length > 0 ? (
                      completedTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          myAgents={invitedAgents}
                          type="completed"
                        />
                      ))
                    ) : (
                      <p className="text-act-2-gray-medium text-center py-4">
                        No completed tasks at the moment
                      </p>
                    )}
                  </TabsContent>

                  {/* Disputed Tasks Tab */}
                  <TabsContent value="disputed" className="space-y-4">
                    {disputedTasks.length > 0 ? (
                      disputedTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          myAgents={invitedAgents}
                          type="disputed"
                        />
                      ))
                    ) : (
                      <p className="text-act-2-gray-medium text-center py-4">
                        No disputed tasks at the moment
                      </p>
                    )}
                  </TabsContent>

                  {/* Other Tasks Tab (Deleted, Expired, Resolved) */}
                  <TabsContent value="other" className="space-y-4">
                    {otherTasks.length > 0 ? (
                      otherTasks.map(task => (
                        <TaskCard
                          key={task.taskId}
                          task={task}
                          myAgents={invitedAgents}
                          type="other"
                        />
                      ))
                    ) : (
                      <p className="text-act-2-gray-medium text-center py-4">
                        No other tasks at the moment
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Job History & Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Job History & Pipeline</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <CardInner>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-act-2-gray-medium">Open Invitations</span>
                      <span className="text-act-2-purple-light font-medium">
                        {invitationTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-act-2-gray-medium">
                      <Clock className="h-4 w-4 mr-1 text-act-2-purple-light" />
                      Pending Review
                    </div>
                  </CardInner>

                  <CardInner>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-act-2-gray-medium">Assigned Tasks</span>
                      <span className="text-act-2-gray-light font-medium">
                        {assignedTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-act-2-gray-medium">
                      <Clock className="h-4 w-4 mr-1 text-act-2-gray-light" />
                      In Progress
                    </div>
                  </CardInner>

                  <CardInner>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-act-2-gray-medium">Completed Jobs</span>
                      <span className="text-act-2-purple font-medium">{completedTasks.length}</span>
                    </div>
                    <div className="flex items-center text-sm text-act-2-gray-medium">
                      <CheckCircle className="h-4 w-4 mr-1 text-act-2-purple" />
                      From Requests
                    </div>
                  </CardInner>
                </div>

                <div className="space-y-4">
                  {lastAssignedTask ? (
                    <CardInner>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">Last Request Accepted</span>
                        <span className="text-act-2-purple-light">
                          {formatReward(lastAssignedTask.reward)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-act-2-gray-medium">
                        <Bot className="h-4 w-4 mr-1 text-act-2-purple-light" />
                        {lastAssignedTask.metadata?.serviceName || lastAssignedTask.topic}
                      </div>
                    </CardInner>
                  ) : (
                    <CardInner>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">No Accepted Requests Yet</span>
                        <span className="text-act-2-purple-light">-</span>
                      </div>
                    </CardInner>
                  )}

                  {lastDeclinedTask ? (
                    <CardInner>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">Last Request Declined</span>
                        <span className="text-act-2-gray-light">
                          {formatReward(lastDeclinedTask.reward)}
                        </span>
                      </div>
                    </CardInner>
                  ) : (
                    <CardInner>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white">No Declined Requests</span>
                        <span className="text-act-2-gray-light">-</span>
                      </div>
                    </CardInner>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Only visible on desktop */}
          <div className="hidden lg:block space-y-6">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <CardInner>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
                        <Star className="h-5 w-5 text-act-2-purple-light" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Task Overview</h3>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-act-2-gray-light fill-act-2-gray-light" />
                          <span className="text-act-2-gray-light text-sm ml-1">
                            {tasks.data?.filter(task => task.rating)?.length || 0} Rated Tasks
                          </span>
                        </div>
                        <p className="text-sm text-act-2-gray-medium mt-2">
                          {tasks.data?.length || 0} Total Tasks
                        </p>
                      </div>
                    </div>
                  </CardInner>

                  <CardInner>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
                        <Bot className="h-5 w-5 text-act-2-gray-light" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Task Complexity</h3>
                        <p className="text-sm text-act-2-gray-medium mt-1">
                          {invitationTasks.length > 0 ? 'Invitations Available' : 'No Invitations'}
                        </p>
                        <p className="text-sm text-act-2-gray-medium mt-2">
                          {assignedTasks.length} Assigned{' '}
                          {assignedTasks.length === 1 ? 'Task' : 'Tasks'}
                        </p>
                      </div>
                    </div>
                  </CardInner>

                  <CardInner>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
                        <Scale className="h-5 w-5 text-act-2-purple" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Workload Balance</h3>
                        <p className="text-sm text-act-2-gray-medium mt-1">
                          {assignedTasks.length} Assigned Tasks
                        </p>
                        <div className="w-full bg-act-2-dark-blue-gray rounded-full h-2 mt-2">
                          <div
                            className="bg-act-2-purple h-2 rounded-full"
                            style={{ width: `${Math.min(assignedTasks.length * 20, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardInner>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full">
                    <span className="flex items-center justify-center">
                      <Shield className="h-4 w-4 mr-2" />
                      View Contract Terms
                    </span>
                  </Button>
                  <Button className="w-full" variant="secondary">
                    <span className="flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Buyer
                    </span>
                  </Button>
                  <Button className="w-full" variant="secondary">
                    <span className="flex items-center justify-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Share Portfolio
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// New unified TaskCard component
const TaskCard = ({
  task,
  myAgents,
  type,
}: {
  task: TaskDetails;
  myAgents: AgentDetails[];
  type: string;
}) => {
  // Find invited and assigned agents
  const invitedAgentIds = task.invitedAgents.map(agent => agent.agentId);
  const assignedAgentId = task.assignedAgent || '';

  // Get names of my agents that are invited to this task
  const myInvitedAgents = myAgents.filter(agent => invitedAgentIds.includes(agent.id));
  const myAssignedAgent = myAgents.find(agent => agent.id === assignedAgentId);

  // Get correct icon based on task state
  const getStateIcon = () => {
    switch (type) {
      case 'invitation':
        return <AlertTriangle className="h-4 w-4 mr-1 text-act-2-gray-light" />;
      case 'assigned':
        return <Clock className="h-4 w-4 mr-1 text-act-2-purple-light" />;
      case 'submitted':
        return <Send className="h-4 w-4 mr-1 text-act-2-gray-light" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-1 text-act-2-purple" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4 mr-1 text-act-2-gray-light" />;
      case 'other':
        if (task.state === TaskState.DELETED)
          return <XCircle className="h-4 w-4 mr-1 text-act-2-gray-light" />;
        if (task.state === TaskState.EXPIRED)
          return <Clock className="h-4 w-4 mr-1 text-act-2-gray-light" />;
        return <CheckCircle className="h-4 w-4 mr-1 text-act-2-gray-light" />;
      default:
        return <Info className="h-4 w-4 mr-1 text-act-2-gray-light" />;
    }
  };

  // Get state description text
  const getStateText = () => {
    switch (type) {
      case 'invitation':
        return 'Invitation to complete task';
      case 'assigned':
        return 'In progress';
      case 'submitted':
        return 'Awaiting review';
      case 'completed':
        return 'Completed';
      case 'disputed':
        return 'Disputed';
      case 'other':
        if (task.state === TaskState.DELETED) return 'Deleted';
        if (task.state === TaskState.EXPIRED) return 'Expired';
        return 'Resolved';
      default:
        return 'Unknown state';
    }
  };

  return (
    <CardInner>
      {/* Task Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-white font-medium flex items-center">
          {task.metadata?.serviceName || task.topic}
          <Link href={`/tasks/${task.taskId}`}>
            <ExternalLink className="h-4 w-4 ml-2 text-act-2-gray-light" />
          </Link>
        </span>
        <span
          className={
            type === 'disputed' || type === 'other'
              ? 'text-act-2-gray-light'
              : 'text-act-2-purple-light'
          }
        >
          {formatReward(task.reward)}
        </span>
      </div>

      {/* Task State */}
      <div className="flex items-center text-sm text-act-2-gray-medium mb-2">
        {getStateIcon()}
        {getStateText()}
        {task.updatedAtTs && (
          <span className="ml-2">
            {new Date(Number(task.updatedAtTs) * 1000).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Assigned/Invited Agent Info */}
      <div className="text-sm text-act-2-gray-medium mb-2">
        {type === 'invitation' && (
          <div>
            Invited Agent{myInvitedAgents.length > 1 ? 's' : ''}:{' '}
            {myInvitedAgents.map(agent => agent.metadata?.name).join(', ')}
          </div>
        )}
        {type !== 'invitation' && myAssignedAgent && (
          <div>Assigned to: {myAssignedAgent.metadata?.name}</div>
        )}
      </div>

      {/* Accordion for more details */}
      <Accordion type="single" collapsible className="w-full mt-2">
        <AccordionItem value="details" className="border-0">
          <AccordionTrigger className="py-2 text-act-2-gray-medium text-sm">
            More details
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            {type === 'invitation' && (
              <div className="space-y-3">
                <div>
                  <div className="text-act-2-gray-medium mb-1">Total Invited Agents</div>
                  <div className="text-white">{invitedAgentIds.length}</div>
                </div>
                <div>
                  <div className="text-act-2-gray-medium mb-1">Task Description</div>
                  <div className="text-white">
                    {task.metadata?.prompt || 'No description provided'}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-act-2-dark-blue-gray">
                  <Button variant="destructive" size="sm" className="text-xs">
                    Decline
                  </Button>
                  <Button variant="default" size="sm" className="text-xs">
                    Accept
                  </Button>
                </div>
              </div>
            )}

            {type !== 'invitation' && (
              <div className="space-y-3">
                <div>
                  <div className="text-act-2-gray-medium mb-1">Task Description</div>
                  <div className="text-white">
                    {task.metadata?.prompt || 'No description provided'}
                  </div>
                </div>
                {/* {task.deadline && (
                    <div>
                    <div className="text-act-2-gray-medium mb-1">Deadline</div>
                    <div className="text-white">
                      {new Date(Number(task.deadline) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                )} */}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardInner>
  );
};
