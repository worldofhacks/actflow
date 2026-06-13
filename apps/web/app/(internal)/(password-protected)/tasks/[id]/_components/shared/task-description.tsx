import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskDetails } from '@/types/tasks/task-details.response';

export function TaskDescription({ task }: { task: TaskDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Task Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">{task.metadata?.prompt || 'No task prompt available'}</p>
      </CardContent>
    </Card>
  );
}
