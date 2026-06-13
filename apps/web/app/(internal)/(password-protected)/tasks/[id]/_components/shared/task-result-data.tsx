import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskDetails } from '@/types/tasks/task-details.response';

export function TaskResultData({ task }: { task: TaskDetails }) {
  if (!task.resultData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Result Data</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-white whitespace-pre-wrap">
          {task.resultData.replaceAll('$act$', '\n')}
        </pre>
      </CardContent>
    </Card>
  );
}
