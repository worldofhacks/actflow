import { Role } from '@/types/user';
import { Bot, Clock, ExternalLink, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { AgentDetails } from '@/types/agent/agent';
import { AgentName } from './agent/agent-name';
import { RealtimeStatusLabel } from './agent/realtime-status-label';
import { Button } from './ui/button';
import { Tag } from './ui/tag';

interface AIAgentProfileHeaderProps {
  agent: AgentDetails;
  userRole: string;
}

const AgentProfileHeader: React.FC<AIAgentProfileHeaderProps> = ({ agent, userRole }) => {
  // const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div>
      <div className="w-full pt-4 lg:pt-8 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left Section: Avatar, Title, Stats */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-6 text-center lg:text-left">
            {/* Status Label and Avatar */}
            <div className="flex flex-col items-center mb-4 lg:mb-0">
              {agent.realtimeStatus && (
                <div className="mb-2">
                  <RealtimeStatusLabel
                    realtimeStatus={agent.realtimeStatus}
                    className="text-sm py-1 px-3"
                  />
                </div>
              )}
              <div className="relative">
                <div className="w-24 h-24 lg:w-20 lg:h-20 rounded-full overflow-hidden ">
                  <div className="rounded-full  h-20 w-20 bg-white bg-opacity-[0.03] flex items-center justify-center ring-2  transition-all duration-300 shadow-md">
                    <Bot className="h-8 w-8 text-act-2-purple" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-full border border-[#2A2438]">
                  <Bot className="h-5 w-5 text-act-2-purple" />
                </div>
              </div>
            </div>

            {/* Title and Stats */}
            <div>
              <Tag className="mb-2 text-sm text-act-2-purple">{agent.topic}</Tag>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/75 text-transparent bg-clip-text">
                {agent.metadata?.name ?? 'Agent'}
              </h1>
              <div className="flex justify-center lg:justify-start mb-2 text-sm">
                <AgentName address={agent.agentId} showAvatar />
              </div>
              <p className="text-gray-400 mb-3">
                {agent.skills?.map(skill => skill.skillName.split(':')[1])?.join(', ')}
              </p>
              <div className="flex  text-sm flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-6">
                <div className="flex items-center">
                  <Star className="h-5 w-5" />
                  <span className="text-white ml-1">{agent.statistics?.averageRating}</span>
                </div>
                <div className="flex items-center ">
                  <Bot className="h-5 w-5 mr-1" />
                  <span>{agent.statistics?.successRate}% Success Rate</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Clock className="h-5 w-5 mr-1" />
                  <span>{agent.statistics?.averageCompletionTime} Avg. Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex items-center justify-center lg:justify-end space-x-3">
            {userRole === Role.User && (
              <Link href={`/agent/${agent.agentId}/hire`}>
                <Button>
                  <span className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Hire Agent
                  </span>
                </Button>
              </Link>
            )}
            {agent.metadata?.socialUrl && (
              <Link href={agent.metadata?.socialUrl} target="_blank">
                <Button variant={'secondary'}>
                  <span className="flex items-center">
                    <ExternalLink className="h-5 w-5 mr-2" />X Profile
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfileHeader;
