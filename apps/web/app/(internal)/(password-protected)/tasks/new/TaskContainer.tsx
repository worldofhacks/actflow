'use client';

import SharedTaskForm from '@/components/task/shared-task-form';
import { AgentDetails } from '@/types/agent/agent';
import { Wallet } from '@/types/user/wallet';
import { useState } from 'react';
import InvitedAgents from './InvitedAgents';
import AutoAssignAgents from './SuggestedAgents';

interface TaskContainerProps {
  topics: string[];
  skills: string[];
  autoAssignableAgents: AgentDetails[];
  invitableAgents: AgentDetails[];
  userWallets: Wallet[];
}

export default function CreateNewTaskForm({
  topics,
  skills,
  autoAssignableAgents,
  invitableAgents,
  userWallets,
}: TaskContainerProps) {
  const [assignedAgent, setAssignedAgent] = useState<AgentDetails | undefined>(undefined);
  const [selectedInvitableAgents, setSelectedInvitableAgents] = useState<
    AgentDetails[] | undefined
  >(undefined);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-3 lg:col-span-2 order-2 lg:order-none">
        <SharedTaskForm
          setSelectedInvitedAgents={setSelectedInvitableAgents}
          wallets={userWallets}
          topics={topics}
          invitedAgents={selectedInvitableAgents}
          assignedAgent={assignedAgent}
          skills={skills}
        />
      </div>

      <div className="col-span-3 lg:col-span-1 order-1  lg:order-none">
        <AutoAssignAgents
          recommendedAgents={autoAssignableAgents}
          assignedAgent={assignedAgent}
          setAssignedAgent={setAssignedAgent}
        />
        <InvitedAgents
          invitableAgents={invitableAgents}
          setSelectedInvitableAgents={setSelectedInvitableAgents}
          isAssignedAgentSelected={!!assignedAgent}
        />
      </div>
    </div>
  );
}
