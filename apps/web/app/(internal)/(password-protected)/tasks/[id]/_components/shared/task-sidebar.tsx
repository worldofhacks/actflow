import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardInner,
  CardTitle,
} from '@/components/ui/card';
import { shortenAddress } from '@/lib/utils';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { Bot } from 'lucide-react';
import Link from 'next/link';

export function TaskSidebar({ task }: { task: TaskDetails }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {task.assignedAgent
              ? 'Assigned Agent'
              : task.invitedAgents.length > 0
                ? 'Invited Agents'
                : 'No agents assigned/invited'}
          </CardTitle>
          <CardDescription>
            {task.assignedAgent
              ? `Agent assigned to this task: ${shortenAddress(task.assignedAgent)}`
              : `${task.invitedAgents.length} agent${
                  task.invitedAgents.length > 1 ? 's' : ''
                } invited to collaborate on this task`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CardInner>
            {task.assignedAgent ? (
              <Link
                href={`/agent/${task.assignedAgent}`}
                className="text-act-2-purple-light hover:underline flex items-center"
              >
                {shortenAddress(task.assignedAgent)}
              </Link>
            ) : task.invitedAgents.length > 0 ? (
              task.invitedAgents.map(agent => (
                <Link
                  key={agent.agentId}
                  href={`/agent/${agent.agentId}`}
                  className="text-act-2-purple-light hover:underline flex items-center"
                >
                  <Bot /> {agent.metadata?.name}
                </Link>
              ))
            ) : (
              <div className="text-gray-400">No agents assigned/invited</div>
            )}
          </CardInner>
        </CardContent>
      </Card>

      {/* Additional Details Card */}
      {task.metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">Additional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {task.metadata.isPlatformManaged !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-gray-400">Platform Managed:</span>
                    <span
                      className={
                        task.metadata.isPlatformManaged
                          ? 'text-act-2-purple-light'
                          : 'text-act-2-gray-light'
                      }
                    >
                      {task.metadata.isPlatformManaged ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {task.metadata.isValid !== undefined && (
                  <div className="flex flex-col">
                    <span className="text-gray-400">Valid:</span>
                    <span
                      className={task.metadata.isValid ? 'text-act-2-purple-light' : 'text-red-400'}
                    >
                      {task.metadata.isValid ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>

              {task.metadata.features && task.metadata.features.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-1">Features:</span>
                  <div className="flex flex-wrap gap-2">
                    {task.metadata.features.map((feature: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-act-elevated rounded-md text-act-2-purple"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.metadata.addOns && task.metadata.addOns.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-1">Add-ons:</span>
                  <div className="flex flex-wrap gap-2">
                    {task.metadata.addOns.map((addon, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-act-elevated rounded-md text-act-2-purple"
                      >
                        {addon.name} (+{addon.price})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating & Feedback */}
      {(task.rating || task.feedback) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">Rating & Feedback</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {task.rating && (
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Rating:</span>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < task.rating!
                          ? 'text-act-2-purple fill-act-2-purple-light'
                          : 'text-gray-400'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
            )}

            {task.feedback && <CardInner>{task.feedback}</CardInner>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
