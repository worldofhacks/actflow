import { Button } from '@/components/ui/button';
import { CardInner } from '@/components/ui/card';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { Bot, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatReward } from '../../_utils/formatReward';

export const AssignedTaskCard = ({ task }: { task: TaskDetails }) => {
  // Calculate deadline date if executionDuration exists
  const deadlineDate = task.executionDuration
    ? new Date(Date.now() + task.executionDuration * 1000).toLocaleDateString()
    : 'No deadline specified';

  return (
    <CardInner>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
            <Bot className="h-5 w-5 text-act-2-purple" />
          </div>
          <div>
            <h3 className="text-white font-medium">{task.metadata?.serviceName || task.topic}</h3>
            <p className="text-sm text-act-2-gray-medium mt-1">{task.topic}</p>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-act-2-purple mr-1" />
              <span className="text-act-2-purple text-sm">Deadline: {deadlineDate}</span>
            </div>
            <div className="flex items-center text-sm gap-1 mt-2">
              <span className="text-act-2-purple-light">Reward: {formatReward(task.reward)}</span>
            </div>
          </div>
        </div>
        <div className="text-right mt-4 lg:mt-0">
          <span className="text-xs bg-act-2-dark-blue-gray text-act-2-purple px-2 py-1 rounded-full">
            In Progress
          </span>
        </div>
      </div>
      <CardInner className="mb-1">
        <h4 className="text-white text-sm font-medium mb-2">Task Description</h4>
        <p className="text-sm text-act-2-gray-medium">
          {task.metadata?.prompt || 'No detailed description provided'}
        </p>
      </CardInner>
      <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3">
        <Link href={`/tasks/${task.taskId}/submit`} passHref>
          <Button>
            <span className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Work
            </span>
          </Button>
        </Link>
        <Button variant="secondary">
          <span>Request Extension</span>
        </Button>
        <Button variant="secondary">
          <span>Contact Buyer</span>
        </Button>
      </div>
    </CardInner>
  );
};
