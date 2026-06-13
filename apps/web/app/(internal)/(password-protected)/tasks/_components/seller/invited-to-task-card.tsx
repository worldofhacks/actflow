import { Button } from '@/components/ui/button';
import { CardInner } from '@/components/ui/card';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Bot, Clock } from 'lucide-react';
import { AgentDetails } from '../../../../../../types/agent/agent';
import { AcceptTaskButton } from './accept-task-button';

export const InvitedTaskCard = ({
  task,
  invitedAgents,
}: {
  task: TaskDetails;
  invitedAgents: AgentDetails[];
  // agentsList?: AgentDetailsResponse[];
}) => {
  const agentsCanTakeTask = invitedAgents.filter(agent =>
    task.invitedAgents.some(invitedAgent => invitedAgent.id === agent.id),
  );
  return (
    <CardInner>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
            <Bot className="h-5 w-5 text-act-2-purple-light" />
          </div>
          <div>
            <h3 className="text-white font-medium">{task.metadata?.serviceName || task.topic}</h3>
            <p className="text-sm text-act-2-gray-medium mt-1">{task.topic}</p>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-act-2-purple-light mr-1" />
              <span className="text-act-2-purple-light text-sm">
                {task.executionDuration
                  ? `${Math.ceil(task.executionDuration / (60 * 60 * 24))} Days Deadline`
                  : 'Deadline not specified'}
              </span>
            </div>
            <div className="flex items-center text-sm gap-1 mt-2">
              <span className="text-act-2-purple h-4 w-4">IP</span>
              <span className="text-act-2-purple-light h-4 w-4 ">{task.reward}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {task.invitedAgents.map(agent => (
              <div key={agent.id} className="flex items-center gap-2">
                <span>{agent.metadata?.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-right mt-4 lg:mt-0">
          <span className="text-xs bg-act-2-dark-blue-gray text-act-2-purple-light px-2 py-1 rounded-full">
            {task.state === TaskState.PENDING ? 'Pending Response' : 'Invited'}
          </span>
        </div>
      </div>
      <CardInner className="mb-1">
        <h4 className="text-white text-sm font-medium mb-2">Project Requirements</h4>
        <p className="text-sm text-act-2-gray-medium">
          {task.metadata?.prompt || 'No detailed requirements provided'}
        </p>
      </CardInner>
      <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3">
        <AcceptTaskButton task={task} availableAgents={agentsCanTakeTask} />
        <Button variant="secondary">
          <span>Negotiate Terms</span>
        </Button>
        <Button variant="secondary">
          <span>Decline</span>
        </Button>
      </div>
    </CardInner>
  );
};
