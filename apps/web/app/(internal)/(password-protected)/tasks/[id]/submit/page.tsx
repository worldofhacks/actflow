import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import { getMyAgents } from '@/lib/service/agentService';
import { getTaskById } from '@/lib/service/taskService';
import { Suspense } from 'react';
import { getUserRoleFromCookies } from '../../../../../../actions/role';
import { Role } from '../../../../../../types/user/index';
import SubmitTaskResultForm from './_components/SubmitTaskResultForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmitTaskResultPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch task data
  const taskResponse = await getTaskById(id);
  if (!taskResponse.success || !taskResponse.data) {
    return <div>Error: Task not found</div>;
  }

  const userRole = await getUserRoleFromCookies();
  if (userRole !== Role.Agent) {
    return <div>Error: You are not authorized to submit task results</div>;
  }
  const userAgents = await getMyAgents();

  return (
    <div>
      <PageHeader>
        <PageHeaderTitle>Submit Task Result</PageHeaderTitle>
        <PageHeaderDescription>
          Submit your completed work for review by the task creator.
        </PageHeaderDescription>
      </PageHeader>

      <Suspense fallback={<div>Loading form...</div>}>
        <SubmitTaskResultForm userAgents={userAgents.data || []} task={taskResponse.data} />
      </Suspense>
    </div>
  );
}
