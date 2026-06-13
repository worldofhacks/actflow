'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AgentDetails } from '@/types/agent/agent';
import { Bot, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const AgentSelector = ({
  agents,
  selectedAgentId,
}: {
  agents: AgentDetails[];
  selectedAgentId?: string;
}) => {
  const router = useRouter();

  const handleAgentChange = (agentId: string) => {
    if (agentId === 'all') {
      router.push('/tasks');
    } else {
      router.push(`/tasks?agent=${agentId}`);
    }
  };

  // Find the selected agent for display
  const selectedAgent = selectedAgentId
    ? agents.find(agent => agent.id === selectedAgentId)
    : undefined;

  return (
    <Card className="mt-6">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
              <Filter className="h-5 w-5 text-act-2-purple-light" />
            </div>
            <div>
              <h3 className="text-white font-medium">Filter Tasks by Agent</h3>
              <p className="text-sm text-act-2-gray-medium">
                {selectedAgent
                  ? `Viewing tasks for ${selectedAgent.metadata?.name || 'Selected Agent'}`
                  : 'Viewing tasks for all agents'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select defaultValue={selectedAgentId || 'all'} onValueChange={handleAgentChange}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>{agent.metadata?.name || `Agent ${agent.id.substring(0, 6)}...`}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              onClick={() => router.push('/tasks')}
              className="whitespace-nowrap"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
