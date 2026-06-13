import { Role } from '@/types/user';
import { Award, Bot, Clock, DollarSign, Link2, Star, User, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { AgentDetails } from '../../types/agent/agent';
import { AgentType } from '../../types/agent/agent-type';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardInner,
  CardTitle,
} from '../ui/card';
import { Tag } from '../ui/tag';
import { RealtimeStatusLabel } from './realtime-status-label';

interface AgentCardProps {
  agent: AgentDetails;
  userRole?: string;
  index?: number;
}

export const AgentCard: React.FC<AgentCardProps> = ({ userRole, agent, index = 0 }) => {
  return (
    <Card
      style={
        {
          '--delay': `${index * 0.1 + 0.3}s`,
        } as React.CSSProperties
      }
      className="overflow-hidden
      transition-all duration-300 backdrop-blur-md  h-[510px] w-[400px] flex flex-col motion-delay-[var(--delay)]
      motion-opacity-in-0 -motion-translate-y-in-[40px] hover:scale-[101%]
      relative group"
    >
      <CardHeader className="flex">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.isPaused && (
            <div className="inline-flex items-center px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full font-medium">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              Paused
            </div>
          )}
          <RealtimeStatusLabel realtimeStatus={agent.realtimeStatus} className="py-0.5 px-2" />
        </div>
        <div className="relative flex items-center gap-x-3">
          {agent.metadata?.avatar ? (
            <div className="relative overflow-hidden rounded-full min-h-16 min-w-16 h-16 w-16 ring-2 ring-act-2-dark-gray-200/30 group-hover:ring-act-2-purple/50 transition-all duration-300 shadow-md">
              <Image
                src={agent.metadata.avatar}
                alt={agent.metadata.name || 'Agent'}
                className="object-cover w-full h-full"
                width={64}
                height={64}
              />
            </div>
          ) : agent.metadata?.profileType === AgentType.AI_AGENT ? (
            <div className="rounded-full h-16 w-16 min-h-16 min-w-16 bg-white bg-opacity-[0.03] flex items-center justify-center ring-2 ring-act-2-dark-gray-200/30 group-hover:ring-act-2-purple/50 transition-all duration-300 shadow-md">
              <Bot className="h-8 w-8 text-white/90" />
            </div>
          ) : (
            <div className="rounded-full h-16 w-16 min-h-16 min-w-16 bg-white bg-opacity-[0.03] flex items-center justify-center ring-2 ring-act-2-dark-gray-200/30 group-hover:ring-act-2-purple/50 transition-all duration-300 shadow-md">
              <User className="h-8 w-8 text-white/90" />
            </div>
          )}
          <div className="flex w-full text-wrap flex-col gap-y-1">
            <Tag className="w-fit mb-1 text-xs">{agent.topic}</Tag>
            <CardTitle className="flex items-start space-x-3">
              {agent.metadata?.name || 'Unnamed Agent'}
            </CardTitle>
            <CardDescription className=" overflow-ellipsis line-clamp-2 text-act-2-gray-medium mt-1">
              {agent.metadata?.description || 'No description.'}
            </CardDescription>
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center my-2 gap-x-1">
            <div className="flex bg-act-2-dark-blue-gray/50 rounded-full px-2 py-0.5 items-center">
              <Star className="h-3.5 w-3.5 text-act-2-purple-lighter fill-act-2-purple-lighter mr-1" />
              <span className="text-act-2-purple-lighter text-xs font-medium">
                {agent.statistics?.averageRating}{' '}
                <span className="text-act-2-gray-medium font-normal">
                  ({agent.statistics?.totalRatings})
                </span>
              </span>
            </div>

            {agent.metadata?.socialUrl && (
              <Link
                href={agent.metadata.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline flex items-center text-act-2-gray-medium hover:text-act-2-gray-light transition-colors ml-3"
                passHref={false}
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
              </Link>
            )}
            {/* current tasks amount */}
            <div className="text-xs text-act-2-gray-medium">{agent.tasks?.length} tasks</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-0 md:py-0">
        <div className="flex flex-col flex-grow relative z-10">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <CardInner className="flex-row items-center">
              <div className="bg-act-2-purple/10 rounded-full p-1 mr-2">
                <Clock className="h-4 w-4 text-act-2-purple" />
              </div>
              <div>
                <div className="text-xs text-act-2-gray-medium">Delivery Time</div>
                <div className="text-sm text-white font-medium">
                  {agent.statistics?.averageCompletionTime || 'N/A'}
                </div>
              </div>
            </CardInner>

            <CardInner className="flex-row items-center">
              <div className="bg-act-2-purple-light/10 rounded-full p-1 mr-2">
                <Award className="h-4 w-4 text-act-2-purple" />
              </div>
              <div>
                <div className="text-xs text-act-2-gray-medium">Success Rate</div>
                <div className="text-sm text-white font-medium">
                  {agent.statistics?.successRate}%
                </div>
              </div>
            </CardInner>

            <CardInner className="flex-row items-center">
              <div className="bg-act-2-purple/10 rounded-full p-1 mr-2">
                <Users className="h-4 w-4 text-act-2-purple" />
              </div>
              <div>
                <div className="text-xs text-act-2-gray-medium">Completed</div>
                <div className="text-sm text-white font-medium">
                  {agent.statistics?.totalTasksCompleted} tasks
                </div>
              </div>
            </CardInner>

            <CardInner className="flex-row items-center">
              <div className="bg-act-2-purple-lighter/10 rounded-full p-1 mr-2">
                <DollarSign className="h-4 w-4 text-act-2-purple-lighter" />
              </div>
              <div className="flex w-full overflow-hidden  flex-col">
                <div className="text-xs text-act-2-gray-medium">Total earnings</div>
                <p className="text-sm text-white font-medium truncate">
                  {agent.statistics?.totalEarnings} IP
                </p>
              </div>
            </CardInner>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col h-full justify-end">
        {/* <div className="absolute bottom-full w-full h-12 bg-gradient-to-t from-act-2-dark-blue-gray/90 to-transparent"></div> */}

        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/agent/${agent.agentId}`} className="w-full">
              View Profile
            </Link>
          </Button>
          {userRole === Role.User && (
            <Button size="sm" asChild>
              <Link href={`/agent/${agent.agentId}/hire`} className="w-full">
                Hire Agent
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
