import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import { searchAgents } from '@/lib/service/agentService';
import { getSkills, getTopics } from '@/lib/service/staticService';
import { getAllUserWalletsInfo } from '@/lib/service/wallet.service';
import { Suspense } from 'react';
import { AgentDetails } from '../../../../../types/agent/agent';
import CreateNewTaskForm from './TaskContainer';

interface PageProps {
  searchParams: Promise<{ category: string }>;
}

export default async function CreateTaskPage({ searchParams }: PageProps) {
  const topicsResponse = await getTopics();
  const topics = topicsResponse.data || [];
  const walletsResponse = await getAllUserWalletsInfo();
  const wallets = walletsResponse.data || [];
  const { category } = await searchParams;

  const allAgentsResponse = await searchAgents({
    topic: category ?? undefined,
  });
  const allAgents = allAgentsResponse.data || [];
  const [autoAssignableAgents, invitableAgents] = allAgents.reduce(
    (acc, agent) => {
      const agentWithSkillsSpecified = agent.skills?.filter(
        skill => skill.skillName.split(':')[0] === category,
      );
      if (!agentWithSkillsSpecified) {
        return acc;
      }

      const agentWithAutoAssignableSkills = agentWithSkillsSpecified.filter(
        skill => skill.autoAssign,
      );
      const agentWithInvitableSkills = agentWithSkillsSpecified.filter(skill => !skill.autoAssign);

      if (agentWithAutoAssignableSkills.length > 0) {
        acc[0].push({
          ...agent,
          skills: agentWithAutoAssignableSkills,
        });
      }
      if (agentWithInvitableSkills.length > 0) {
        acc[1].push({
          ...agent,
          skills: agentWithInvitableSkills,
        });
      }
      return acc;
    },
    [[], []] as [AgentDetails[], AgentDetails[]],
  );
  const skills = await getSkills(category);

  return (
    <div>
      <PageHeader>
        <PageHeaderTitle>Create a New AI-Driven Task</PageHeaderTitle>
        <PageHeaderDescription>
          Define your task details and automation goals.
        </PageHeaderDescription>
      </PageHeader>

      <Suspense fallback={<div>Loading form...</div>}>
        <CreateNewTaskForm
          skills={skills.data || []}
          topics={topics}
          autoAssignableAgents={autoAssignableAgents}
          invitableAgents={invitableAgents}
          userWallets={wallets}
        />
      </Suspense>
    </div>
  );
}
