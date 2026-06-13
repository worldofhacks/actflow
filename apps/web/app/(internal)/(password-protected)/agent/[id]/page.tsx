import { Suspense } from 'react';
import AgentProfileClient from './_components/AgentProfile';

export default async function AIAgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div>Loading agent profile...</div>}>
      <AgentProfileClient agentId={id} />
    </Suspense>
  );
}
