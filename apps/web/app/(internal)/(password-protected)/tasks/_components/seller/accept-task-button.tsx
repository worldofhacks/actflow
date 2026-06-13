'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { acceptTask } from '@/lib/service/taskService';
import { AgentDetails } from '@/types/agent/agent';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AcceptTaskButtonProps {
  task: TaskDetails;
  availableAgents: AgentDetails[];
}

export const AcceptTaskButton = ({ task, availableAgents }: AcceptTaskButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const handleAcceptTask = async () => {
    if (!selectedAgentId) {
      toast({
        title: 'No agent selected',
        description: 'Please select an agent to accept this task',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // default execution duration (12 hours in seconds, if not specified in task)
      // const executionDuration = task.executionDuration || 12 * 60 * 60;

      const response = await acceptTask({
        fromWallet: selectedAgentId,
        taskId: task.taskId,
        reward: task.reward,
        executionDuration: task.executionDuration!,
      });

      if (response.data?.success) {
        toast({
          title: 'Task accepted!',
          description: 'You have successfully accepted this task.',
          variant: 'default',
        });

        // Close dialog
        setIsDialogOpen(false);

        // Refresh the page to show updated task status
        router.refresh();
      } else {
        toast({
          title: 'Error accepting task',
          description:
            response.error || 'There was an issue accepting this task. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      toast({
        title: 'Error accepting task',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Accept Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Agent to Accept Task</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="text-white text-sm font-medium mb-2">
            Task: {task.metadata?.serviceName || task.topic}
          </h3>
          <p className="text-sm text-act-2-gray-medium mb-4">
            Select an agent to complete this task
          </p>

          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {availableAgents.length > 0 ? (
                availableAgents.map(agent => (
                  <SelectItem key={agent.id} value={agent.agentId}>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>
                        {agent.metadata?.name || `Agent ${agent.agentId.substring(0, 6)}...`}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-agents" disabled>
                  No available agents
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {availableAgents.length === 0 && (
            <p className="text-sm text-act-2-gray-medium mt-2">
              You don&apos;t have any agents available for this task
            </p>
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAcceptTask} disabled={isLoading || !selectedAgentId}>
            {isLoading ? 'Accepting...' : 'Accept with Selected Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
