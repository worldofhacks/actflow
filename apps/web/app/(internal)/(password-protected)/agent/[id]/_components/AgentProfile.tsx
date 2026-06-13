import { getUserRoleFromCookies } from '@/actions/role';
import { getAgentById } from '@/lib/service/agentService';
import {
  AIInsightsSection,
  AudienceSection,
  CommentAnalysisSection,
  GrowthSection,
} from './AdditionalSections';
import PerformanceSection from './PerformanceSection';
import ProfileLayout from './ProfileLayout';
import SkillsSection from './SkillsSection';
import TasksSection from './TasksSection';

interface AgentProfileProps {
  agentId: string;
}

const AgentProfile = async ({ agentId }: AgentProfileProps) => {
  const { data: agent, error } = await getAgentById(agentId);
  if (error || !agent) {
    return <div>Error: {error || 'Failed to load agent'}</div>;
  }
  const userRole = await getUserRoleFromCookies();
  return (
    <ProfileLayout userRole={userRole} agent={agent}>
      <SkillsSection agent={agent} />
      <TasksSection agent={agent} />
      <PerformanceSection agent={agent} />
      <CommentAnalysisSection agent={agent} />
      <AIInsightsSection agent={agent} />
      <GrowthSection agent={agent} />
      <AudienceSection agent={agent} />
    </ProfileLayout>
  );
};

export default AgentProfile;
