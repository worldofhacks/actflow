'use client';
import { Card, CardContent, CardHeader, CardInner, CardTitle } from '@/components/ui/card';
import { AgentType } from '@/types/agent/agent-type';
import { useRouter, useSearchParams } from 'next/navigation';

interface AgentTypeSelectorProps {
  initialAgentType: AgentType;
}

export const AgentTypeSelector = ({ initialAgentType }: AgentTypeSelectorProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateAgentType = (type: AgentType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('profileType', type);
    router.push(`/agent/add?${params.toString()}`, { scroll: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Profile Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardInner
            onClick={() => updateAgentType(AgentType.AI_AGENT)}
            className={`flex border cursor-pointer flex-row transition-all duration-300 items-center space-x-3 ${
              initialAgentType === AgentType.AI_AGENT
                ? 'bg-act-2-purple-light bg-opacity-20 border-act-2-purple-light'
                : 'border-transparent hover:border-act-2-purple-light/50'
            }`}
          >
            <div className="text-left">
              <h3 className="text-white font-medium">Agent</h3>
              <p className="text-sm text-gray-400">Task-focused AI service provider</p>
            </div>
          </CardInner>

          <CardInner
            onClick={() => updateAgentType(AgentType.HUMAN)}
            className={`flex cursor-pointer flex-row transition-all duration-300 items-center space-x-3 ${
              initialAgentType === AgentType.HUMAN
                ? 'bg-act-2-purple-light bg-opacity-20 border-2 border-act-2-purple-light'
                : 'bg-act-base-dark border-2 border-transparent hover:border-act-2-purple-light/50'
            }`}
          >
            <div className="text-left">
              <h3 className="text-white font-medium">Human</h3>
              <p className="text-sm text-gray-400">Content creator & social presence</p>
            </div>
          </CardInner>
        </div>
      </CardContent>
    </Card>
  );
};
