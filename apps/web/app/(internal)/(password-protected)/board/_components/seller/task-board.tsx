'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { TaskState } from '@/types/tasks/task-state.enum';
import { Bot, Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '../../../../../../components/ui/input';

interface TaskBoardProps {
  allTasks: TaskDetails[];
}

export function SellerTaskBoard({ allTasks }: TaskBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Update search params in URL
  const updateSearchParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const searchQuery = searchParams.get('search') || '';
  const showOnlyOpen = searchParams.get('openOnly') === 'true';

  // Handle checkbox change
  const handleOpenOnlyChange = (checked: boolean) => {
    updateSearchParams('openOnly', checked ? 'true' : '');
  };

  // Filter tasks if showOnlyOpen is true (only show pending tasks)
  const displayedTasks = showOnlyOpen
    ? allTasks.filter(task => task.state === TaskState.PENDING)
    : allTasks;

  return (
    <div className="mb-8">
      {/* Search and Filters */}
      <div className="mb-6 relative">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 z-10 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-act-2-gray-medium" />
          </div>
          <Input
            type="text"
            className="w-full pl-10 h-11 "
            placeholder="Search tasks by name, topic, or description"
            onChange={e => updateSearchParams('search', e.target.value)}
            value={searchQuery}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="openOnly"
              checked={showOnlyOpen}
              onCheckedChange={handleOpenOnlyChange}
              className="border-act-2-purple data-[state=checked]:bg-act-2-purple"
            />
            <Label htmlFor="openOnly" className="text-sm cursor-pointer text-white">
              Show only open tasks
            </Label>
          </div>
        </div>
      </div>

      {/* Tasks Count */}
      <div className="mb-4">
        <h2 className="text-white text-lg font-medium">
          Available Tasks ({displayedTasks.length})
        </h2>
      </div>

      {/* Task Listings */}
      <div className="space-y-4">
        {displayedTasks.length === 0 ? (
          <p>No tasks available. Check back later or adjust your search criteria.</p>
        ) : (
          displayedTasks.map(task => <TaskCard key={task.taskId} task={task} />)
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task }: { task: TaskDetails }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-act-2-dark-blue-gray rounded-lg">
              <Bot className="h-5 w-5 text-act-2-purple-light" />
            </div>
            <div>
              <h3 className="text-white font-medium">{task.metadata?.serviceName || task.topic}</h3>
              <p className="text-sm text-act-2-gray-medium mt-1">{task.topic}</p>

              {/* Task Status Badge */}
              <div className="mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    task.state === TaskState.INVITED
                      ? 'bg-act-2-purple/20 text-act-2-purple-light'
                      : 'bg-act-2-purple-lighter/20 text-act-2-purple-light'
                  }`}
                >
                  {task.state === TaskState.INVITED ? 'Invited' : 'Open Task'}
                </span>
              </div>

              {/* Task details */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-act-2-purple-light mr-1" />
                  <span className="text-act-2-purple-light text-sm">
                    {task.executionDuration
                      ? `${Math.ceil(task.executionDuration / (60 * 60 * 24))} Days Deadline`
                      : 'No deadline'}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-act-2-purple-light mr-1">IP</span>
                  <span className="text-act-2-purple-light text-sm">{task.reward}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <Button asChild>
            <Link href={`/tasks/${task.taskId}`}>
              {task.state === TaskState.INVITED ? 'View Invitation' : 'Apply'}
            </Link>
          </Button>
        </div>

        {/* Project requirements summary */}
        <div className="mt-4 pl-10">
          <p className="text-sm text-act-2-gray-light line-clamp-2">
            {task.metadata?.prompt || 'No detailed requirements provided'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
