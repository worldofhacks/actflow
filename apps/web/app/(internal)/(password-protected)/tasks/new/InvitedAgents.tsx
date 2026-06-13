'use client';

import { AgentDetails } from '@/types/agent/agent';
import { CheckCircle, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardInner,
  CardTitle,
} from '../../../../../components/ui/card';

interface InvitedAgentsProps {
  invitableAgents?: AgentDetails[];
  setSelectedInvitableAgents?: (agent: AgentDetails[] | undefined) => void;
  isAssignedAgentSelected: boolean;
}

export default function InvitedAgents({
  invitableAgents,
  setSelectedInvitableAgents,
  isAssignedAgentSelected,
}: InvitedAgentsProps) {
  // Track which agents are selected in local state
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // Reset selection when assigned agent changes
  useEffect(() => {
    if (isAssignedAgentSelected) {
      setSelectedAgents([]);
      if (setSelectedInvitableAgents) {
        setSelectedInvitableAgents(undefined);
      }
    }
  }, [isAssignedAgentSelected, setSelectedInvitableAgents]);

  const handleAgentClick = (agent: AgentDetails) => {
    if (isAssignedAgentSelected) return;

    // Toggle selection
    const isCurrentlySelected = selectedAgents.includes(agent.agentId);
    let newSelectedAgents: string[];

    if (isCurrentlySelected) {
      newSelectedAgents = selectedAgents.filter(id => id !== agent.agentId);
    } else {
      newSelectedAgents = [...selectedAgents, agent.agentId];
    }

    setSelectedAgents(newSelectedAgents);

    // Update parent component with selected agents
    if (setSelectedInvitableAgents) {
      if (newSelectedAgents.length > 0) {
        const selectedAgentsList =
          invitableAgents?.filter(a => newSelectedAgents.includes(a.agentId)) || [];
        setSelectedInvitableAgents(selectedAgentsList);
      } else {
        setSelectedInvitableAgents(undefined);
      }
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Invite Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invitableAgents && invitableAgents.length > 0 ? (
            invitableAgents.map((agent, index) => {
              const isSelected = selectedAgents.includes(agent.agentId);
              const isDisabled = isAssignedAgentSelected;

              return (
                <CardInner
                  key={agent.agentId}
                  style={
                    {
                      '--delay': `${index * 0.1 + 0.1}s`,
                    } as React.CSSProperties
                  }
                  className={`relative overflow-hidden border ${
                    isSelected ? 'border-act-2-purple shadow-sm' : 'border-act-border'
                  } ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:scale-[101%]'
                  } border transition-all motion-delay-[var(--delay)] duration-200 motion-opacity-in-0`}
                  onClick={() => !isDisabled && handleAgentClick(agent)}
                >
                  {isSelected && (
                    <div className="absolute motion-translate-y-in-10 motion-opacity-in-10 motion-scale-out-100 top-2 right-2 bg-act-2-purple text-white text-xs font-medium py-0.5 px-2 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-2.5 w-2.5" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Agent avatar */}
                    <div className="relative flex-shrink-0">
                      {agent.metadata?.avatar ? (
                        <div
                          className={`rounded-full ${isSelected ? 'ring-1 ring-act-2-purple' : ''}`}
                        >
                          <Image
                            src={agent.metadata.avatar}
                            alt={agent.metadata.name || 'Agent'}
                            width={42}
                            height={42}
                            className="rounded-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`h-10 w-10 rounded-full border border-act-border flex items-center justify-center ${
                            isSelected
                              ? 'bg-act-2-purple/20 ring-1 ring-act-2-purple'
                              : 'bg-white bg-opacity-[0.03]'
                          }`}
                        >
                          <span className="text-sm font-bold text-white">
                            {agent.metadata?.name?.charAt(0) || 'A'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Agent details */}
                    <div className="flex-1 min-w-0 flex flex-col w-full">
                      <h4 className="text-white font-semibold text-sm">
                        {agent.metadata?.name || 'Unnamed Agent'}
                      </h4>

                      <p className="text-gray-300 text-xs line-clamp-1 mt-0.5 mb-1.5">
                        {agent.topic}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {agent.skills?.map(skill => (
                      <span
                        key={skill.skillName}
                        className="text-xs px-2 py-0.5 bg-act-2-midnight-blue rounded-full text-white/80"
                      >
                        {skill.skillName}
                      </span>
                    ))}
                  </div>
                </CardInner>
              );
            })
          ) : (
            <CardInner className="flex flex-col text-center text-act-2-gray-medium items-center gap-x-2">
              <UserPlus className="h-8 w-8 " />
              <p className="text-sm">
                No agents you can invite.
                <br />
                Try selecting a different category.
              </p>
            </CardInner>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
