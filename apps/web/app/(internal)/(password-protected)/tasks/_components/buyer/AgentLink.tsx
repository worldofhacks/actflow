'use client';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '../../../../../../lib/utils';
import { TaskState } from '../../../../../../types/tasks/task-state.enum';

export default function AgentLink({
  agentAddress,
  taskState,
}: {
  agentAddress: string;
  taskState: TaskState;
}) {
  const router = useRouter();
  return (
    <>
      {taskState !== TaskState.PENDING && taskState !== TaskState.INVITED && (
        <>
          <button
            className="gap-2 flex items-center text-sm transition-colors hover:text-act-turquoise"
            onClick={e => {
              e.preventDefault();
              router.push(`/agent/${agentAddress}`);
            }}
          >
            <span>AI Agent: {shortenAddress(agentAddress)}</span>
            <ExternalLink size={12} />
          </button>
        </>
      )}
    </>
  );
}
