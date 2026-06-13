'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CircleDot, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTaskById } from '@/lib/service/taskService';
import { TaskState } from '@/types/tasks/task-state.enum';

interface TaskStatusTrackerProps {
  /** The marketplace task id to poll. When absent, the tracker is hidden. */
  taskId?: string;
  /** Poll interval in ms (default 5s). */
  intervalMs?: number;
  className?: string;
}

/** The happy-path lifecycle we surface as a stepper. */
const STEPS: { state: TaskState; label: string }[] = [
  { state: TaskState.PENDING, label: 'Pending' },
  { state: TaskState.ASSIGNED, label: 'Assigned' },
  { state: TaskState.SUBMITTED, label: 'Submitted' },
  { state: TaskState.VALIDATED, label: 'Validated' },
  { state: TaskState.RESOLVED, label: 'Resolved' },
];

/** Map a raw TaskState to the index of the furthest step it has reached. */
function stepIndexForState(state: TaskState): number {
  switch (state) {
    case TaskState.PENDING:
    case TaskState.INVITED:
      return 0;
    case TaskState.ASSIGNED:
      return 1;
    case TaskState.SUBMITTED:
      return 2;
    case TaskState.VALIDATED:
    case TaskState.COMPLETED:
      return 3;
    case TaskState.RESOLVED:
      return 4;
    default:
      return 0;
  }
}

/** Terminal states where polling can stop. */
function isTerminal(state: TaskState): boolean {
  return [
    TaskState.RESOLVED,
    TaskState.DELETED,
    TaskState.EXPIRED,
    TaskState.DECLINED_BY_OWNER,
    TaskState.DECLINED_BY_VALIDATOR,
  ].includes(state);
}

function StateBadge({ state }: { state: TaskState }) {
  const label = TaskState[state] ?? 'Unknown';
  const tone =
    state === TaskState.VALIDATED || state === TaskState.RESOLVED || state === TaskState.COMPLETED
      ? 'bg-emerald-500/15 text-emerald-300'
      : state === TaskState.EXPIRED ||
          state === TaskState.DELETED ||
          state === TaskState.DECLINED_BY_OWNER ||
          state === TaskState.DECLINED_BY_VALIDATOR ||
          state === TaskState.DISPUTED_BY_OWNER ||
          state === TaskState.DISPUTED_BY_AGENT
        ? 'bg-destructive/15 text-destructive'
        : 'bg-white/10 text-white';
  return <Badge className={cn('border-transparent', tone)}>{label}</Badge>;
}

/**
 * Live task status via the marketplace contract state machine.
 *
 * Polls the task endpoint (server action `getTaskById`) on an interval and
 * renders a PENDING -> ASSIGNED -> SUBMITTED -> VALIDATED -> RESOLVED stepper.
 * Stops polling once the task reaches a terminal state. Explicit loading / error
 * states — no unbounded spinner.
 */
export function TaskStatusTracker({ taskId, intervalMs = 5000, className }: TaskStatusTrackerProps) {
  const [state, setState] = useState<TaskState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getTaskById(taskId);
        if (cancelled) return;
        if (res.success && res.data) {
          setState(res.data.state);
          setError(null);
          if (!isTerminal(res.data.state)) {
            timerRef.current = setTimeout(poll, intervalMs);
          }
        } else {
          setError(res.message || 'Could not load task status.');
          timerRef.current = setTimeout(poll, intervalMs);
        }
      } catch {
        if (cancelled) return;
        setError('Could not load task status.');
        timerRef.current = setTimeout(poll, intervalMs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    poll();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [taskId, intervalMs]);

  if (!taskId) return null;

  const activeIndex = state != null ? stepIndexForState(state) : -1;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CircleDot className="size-5 text-white" />
          Task status
        </CardTitle>
        {state != null ? (
          <StateBadge state={state} />
        ) : loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && state == null ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const done = activeIndex > i;
              const current = activeIndex === i;
              return (
                <li key={step.state} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                      done
                        ? 'border-transparent bg-white text-black'
                        : current
                          ? 'border-white text-white'
                          : 'border-white/20 text-muted-foreground',
                    )}
                  >
                    {done ? (
                      <Check className="size-3.5" />
                    ) : current ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      done || current ? 'font-medium text-white' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-xs text-muted-foreground">
          Task #{taskId} · updates live from the marketplace contract.
        </p>
      </CardContent>
    </Card>
  );
}
