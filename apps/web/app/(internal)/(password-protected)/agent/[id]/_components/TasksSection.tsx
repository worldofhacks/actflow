import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardInner,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseTopicValue } from '@/lib/utils/agents';
import { AgentDetails } from '@/types/agent/agent';
import { ServiceAddOn } from '@/types/tasks/domain/task-metadata';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { TaskState } from '@/types/tasks/task-state.enum';
import { AlertCircle, CheckCircle2, Clock, Hourglass, XCircle } from 'lucide-react';
import Link from 'next/link';

interface TasksSectionProps {
  agent: AgentDetails;
}

const TasksSection = ({ agent }: TasksSectionProps) => {
  const getTaskStateLabel = (state: TaskState) => {
    switch (state) {
      case TaskState.PENDING:
        return {
          label: 'Pending',
          color: 'text-yellow-400',
          icon: <Clock className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.INVITED:
        return {
          label: 'Invitation',
          color: 'text-blue-400',
          icon: <Hourglass className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.ASSIGNED:
        return {
          label: 'Assigned',
          color: 'text-indigo-400',
          icon: <Hourglass className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.SUBMITTED:
        return {
          label: 'Awaiting Approval',
          color: 'text-orange-400',
          icon: <AlertCircle className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.DISPUTED_BY_AGENT:
        return {
          label: 'In Dispute',
          color: 'text-red-400',
          icon: <XCircle className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.DISPUTED_BY_OWNER:
        return {
          label: 'In Dispute',
          color: 'text-red-400',
          icon: <XCircle className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.COMPLETED:
        return {
          label: 'Completed',
          color: 'text-green-400',
          icon: <CheckCircle2 className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.DELETED:
        return {
          label: 'Deleted',
          color: 'text-gray-400',
          icon: <XCircle className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.VALIDATED:
        return {
          label: 'Validated',
          color: 'text-green-400',
          icon: <CheckCircle2 className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.DECLINED_BY_OWNER:
        return {
          label: 'Declined by Owner',
          color: 'text-red-400',
          icon: <XCircle className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.DECLINED_BY_VALIDATOR:
        return {
          label: 'Declined by Validator',
          color: 'text-red-400',
          icon: <XCircle className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.RESOLVED:
        return {
          label: 'Resolved',
          color: 'text-green-400',
          icon: <CheckCircle2 className="h-4 w-4 pointer-events-none" />,
        };
      case TaskState.EXPIRED:
        return {
          label: 'Expired',
          color: 'text-gray-400',
          icon: <Clock className="h-4 w-4 pointer-events-none" />,
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-400',
          icon: <AlertCircle className="h-4 w-4 pointer-events-none" />,
        };
    }
  };

  const formatCryptoAmount = (amount: string) => {
    // Convert from wei to IP (or appropriate token)
    const ethValue = parseInt(amount) / 1e18;
    return ethValue.toFixed(6) + ' IP';
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderTaskCard = (task: TaskDetails) => {
    const stateInfo = getTaskStateLabel(task.state);

    return (
      <Link className="w-full h-full" href={`/tasks/${task.taskId}`} key={task.taskId}>
        <CardInner className="hover:bg-act-2-dark-gray-200 transition-colors w-full h-full justify-between items-start">
          <div className="space-y-2">
            <h4 className="text-white text-lg font-medium">
              {task.metadata?.serviceName || `Task #${task.taskId}`}
            </h4>
            {task.metadata?.deliveryTime && (
              <div className="block md:hidden">
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm mr-2">Delivery:</span>
                  <span className="text-act-2-purple text-xs">
                    {task.metadata.deliveryTime === 'ONE_WEEK'
                      ? '1 Week Delivery'
                      : task.metadata.deliveryTime === 'ONE_DAY'
                        ? '1 Day Delivery'
                        : task.metadata.deliveryTime === 'THREE_DAYS'
                          ? '3 Days Delivery'
                          : task.metadata.deliveryTime}
                  </span>
                </div>
              </div>
            )}
            <p className="text-gray-400 text-sm">
              {task.metadata?.prompt || 'No prompt available'}
            </p>

            <div className="flex gap-4 mt-2 flex-col sm:flex-row sm:items-center">
              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-2">State:</span>
                <span className={`${stateInfo.color} text-sm font-medium flex items-center`}>
                  {stateInfo.icon}
                  <span className="ml-1">{stateInfo.label}</span>
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-2">Topic:</span>
                <span className="text-white text-sm">{parseTopicValue(task.topic)}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-2 flex-col sm:flex-row sm:items-center">
              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-2">Creator:</span>
                <span className="text-act-2-purple text-sm">{shortenAddress(task.creator)}</span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-2">Reward:</span>
                <span className="text-act-2-purple text-sm font-medium">
                  {formatCryptoAmount(task.reward)}
                </span>
              </div>
            </div>

            {task.metadata?.features && task.metadata.features.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Features:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {task.metadata.features.map((feature: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-act-2-dark-gray-200 rounded-md text-xs text-[#D77FEC]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.metadata?.addOns && task.metadata.addOns.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Add-ons:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {task.metadata.addOns.map((addon: ServiceAddOn, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-act-2-dark-gray-200 rounded-md text-xs text-act-blue"
                    >
                      {addon.name} (+{addon.price})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {task.metadata?.deliveryTime && (
            <div className="bg-act-2-dark-gray-200 px-3 py-1 rounded-md hidden md:block">
              <span className="text-act-2-purple text-xs">
                {task.metadata.deliveryTime === 'ONE_WEEK'
                  ? '1 Week Delivery'
                  : task.metadata.deliveryTime === 'ONE_DAY'
                    ? '1 Day Delivery'
                    : task.metadata.deliveryTime === 'THREE_DAYS'
                      ? '3 Days Delivery'
                      : task.metadata.deliveryTime}
              </span>
            </div>
          )}
        </CardInner>
      </Link>
    );
  };

  // Separate tasks into completed and pending
  const completedTasks =
    agent.tasks?.filter(
      task => task.state === TaskState.COMPLETED || task.state === TaskState.RESOLVED,
    ) || [];

  const pendingTasks =
    agent.tasks?.filter(
      task => task.state !== TaskState.COMPLETED && task.state !== TaskState.RESOLVED,
    ) || [];

  return (
    <Card className="mb-6" id="tasks">
      {agent.tasks?.length === 0 ? (
        <CardContent>
          <p className="text-center text-lg">No tasks found for this agent</p>
        </CardContent>
      ) : (
        <>
          <CardHeader>
            <CardTitle>Agent Tasks</CardTitle>
            <CardDescription>View all tasks for this agent.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="mb-4 bg-act-2-midnight-blue">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-act-2-dark-gray-200 data-[state=active]:text-white"
                >
                  Pending ({pendingTasks.length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-act-2-dark-gray-200 data-[state=active]:text-white"
                >
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-0">
                <div className="gap-y-4 flex flex-col">
                  {pendingTasks.length === 0 ? (
                    <CardInner className="bg-white/[0.03] flex items-center justify-center">
                      <p className="text-gray-400 text-lg">No pending tasks</p>
                    </CardInner>
                  ) : (
                    pendingTasks.map(task => (
                      <div key={task.taskId} className="w-full">
                        {renderTaskCard(task)}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                <div className="gap-y-4 flex flex-col">
                  {completedTasks.length === 0 ? (
                    <CardInner className="bg-white/[0.03] flex items-center justify-center">
                      <p className="text-gray-400 text-lg">No completed tasks</p>
                    </CardInner>
                  ) : (
                    completedTasks.map(task => (
                      <div key={task.taskId} className="w-full">
                        {renderTaskCard(task)}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default TasksSection;
