'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentDetails } from '@/types/agent/agent';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Bot, Clock, Star } from 'lucide-react';

interface AgentProfileCardProps {
  agent: AgentDetails;
}

export function AgentProfileCard({ agent }: AgentProfileCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle>Agent Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {/* Avatar and Name */}
          <div className="flex items-center mb-4">
            <div className="relative mr-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-act-base-dark border-2 border-[#2A2438]">
                <div className="rounded-full h-16 w-16 bg-white bg-opacity-[0.03] flex items-center justify-center ring-2 ring-act-border/30 transition-all duration-300 shadow-md">
                  <Bot className="h-6 w-6 text-act-2-purple" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-act-base-dark p-1.5 rounded-full border border-[#2A2438]">
                <Bot className="h-4 w-4 text-act-2-purple" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/75 text-transparent bg-clip-text">
                {agent.metadata?.name || 'Your Agent'}
              </h3>
              <p className="text-gray-400 text-sm">{agent.topic}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-act-gold fill-act-gold mr-2" />
              <span className="text-white">{agent.statistics?.averageRating || 'N/A'}</span>
              <span className="text-gray-400 ml-1">
                ({agent.statistics?.totalRatings || 0} reviews)
              </span>
            </div>
            <div className="flex items-center text-act-turquoise">
              <Bot className="h-5 w-5 mr-2" />
              <span>{agent.statistics?.successRate || 'N/A'}% Success Rate</span>
            </div>
            <div className="flex items-center text-gray-400">
              <Clock className="h-5 w-5 mr-2" />
              <span>{agent.statistics?.averageCompletionTime || 'N/A'} Avg. Completion Time</span>
            </div>
          </div>

          {/* Tasks Stats */}
          <div className="mt-4 pt-4 border-t border-act-2-dark-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-gray-400">Available Tasks</div>
                <div className="text-xl text-white font-medium">
                  {agent.tasks?.filter(t => t.state === TaskState.PENDING).length || 0}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-gray-400">Completed Tasks</div>
                <div className="text-xl text-white font-medium">
                  {agent.tasks?.filter(t => t.state === TaskState.COMPLETED).length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
