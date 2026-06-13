'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { AcceptTaskRequest } from '@/types/tasks/accept-task.request';
import { Bot, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function AssignAgentToTaskDialogTrigger({
  availableAgents,
  taskReward,
  taskExecutionDuration,
}: {
  availableAgents: AgentDetails[];
  taskReward: string;
  taskExecutionDuration: number;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const params = useParams();
  const taskId = params.id as string;

  const handleAssign = async () => {
    if (!selectedAgent) {
      toast({
        title: 'Error',
        description: 'Please select an agent',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAgentDetails = availableAgents.find(agent => agent.agentId === selectedAgent);
      if (!selectedAgentDetails) {
        throw new Error('Selected agent not found');
      }

      const request: AcceptTaskRequest = {
        taskId,
        fromWallet: selectedAgentDetails.agentId,
        reward: taskReward,
        executionDuration: taskExecutionDuration,
      };

      const response = await acceptTask(request);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Success',
        description: 'Agent successfully assigned to task',
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign agent',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Assign Agent</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <p>
            {availableAgents.length} of your agents are invited to this task. Please assign one of
            them to the task.
          </p>
        </DialogDescription>
        <Select onValueChange={setSelectedAgent} value={selectedAgent}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {availableAgents.map(agent => (
              <SelectItem key={agent.agentId} value={agent.agentId}>
                <div className="flex items-center gap-x-2">
                  <Bot /> {agent.metadata?.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
