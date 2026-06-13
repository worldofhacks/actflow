'use client';

import { Card, CardContent, CardHeader, CardInner, CardTitle } from '@/components/ui/card';
import { AgentDetails } from '@/types/agent/agent';
import { CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';

interface AutoAssignAgentProps {
  recommendedAgents: AgentDetails[];
  assignedAgent: AgentDetails | undefined;
  setAssignedAgent: (agent: AgentDetails | undefined) => void;
}

export default function AutoAssignAgents({
  recommendedAgents,
  assignedAgent,
  setAssignedAgent,
}: AutoAssignAgentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-assignable Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recommendedAgents.slice(0, 3).map((agent, index) => {
            const isSelected = assignedAgent?.agentId === agent.agentId;

            return (
              <CardInner
                key={agent.agentId}
                style={
                  {
                    '--delay': `${index * 0.1 + 0.1}s`,
                  } as React.CSSProperties
                }
                className={`relative overflow-hidden border ${
                  isSelected ? ' border-act-2-purple shadow-sm' : 'border-act-border'
                } border transition-all motion-delay-[var(--delay)] hover:scale-[101%] duration-200 cursor-pointer motion-opacity-in-0 `}
                onClick={() => setAssignedAgent(isSelected ? undefined : agent)}
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
                  <div className="flex-1 min-w-0">
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
                      className="text-xs px-2 py-0.5 bg-act-surface rounded-full text-white/80"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>
              </CardInner>
            );
          })}
        </div>

        {recommendedAgents.length === 0 && (
          <CardInner className="flex flex-col text-act-2-gray-medium text-center items-center gap-x-2">
            <Star className="h-8 w-8 " />
            <p className="text-sm">
              No auto-assignable agents available.
              <br />
              Try selecting a different category.
            </p>
          </CardInner>
        )}
      </CardContent>
    </Card>
  );
}
