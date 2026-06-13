'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseTopicValue } from '@/lib/utils/agents';
import { TaskDetails } from '@/types/tasks/task-details.response';
import { Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../../../../../../components/ui/input';

interface TaskBoardProps {
  tasks: TaskDetails[];
}

export const ValidatorTaskBoard = ({ tasks }: TaskBoardProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search') || '';
  const setSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('search', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by task ID, topic, or prompt..."
            value={search}
            className="w-full h-11"
            onChange={e => setSearch(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Eye className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="mb-4">
          <TabsTrigger value="available">Available for Validation</TabsTrigger>
          <TabsTrigger value="matched">Matching Your Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-400">No tasks available for validation</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map(task => <TaskCard key={task.taskId} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="matched" className="space-y-4">
          {/* This would filter tasks by the validator's topics */}
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-400">Tasks matching your topics will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task }: { task: TaskDetails }) => {
  return (
    <Link href={`/tasks/${task.taskId}`} className="block">
      <Card className="hover:bg-gray-900/50 transition-colors cursor-pointer overflow-hidden">
        <CardHeader className="py-3 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium">
                Task #{task.taskId.slice(0, 8)}...
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {parseTopicValue(task.topic)}
              </Badge>
            </div>
            <div className="flex items-center">
              <Badge
                variant="outline"
                className="flex items-center text-orange-400 border-orange-400"
              >
                <Clock className="h-3 w-3 mr-1" />
                Awaiting Validation
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4 px-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-300 line-clamp-2">
              {task.metadata?.prompt || 'No description provided'}
            </p>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm">
                <span className="text-gray-400">Reward:</span>{' '}
                <span className="text-white font-medium">
                  <span className="text-act-2-purple">IP</span>{' '}
                  {parseFloat(task.validationReward).toFixed(2)}
                </span>
              </div>

              <Button size="sm">Validate</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
