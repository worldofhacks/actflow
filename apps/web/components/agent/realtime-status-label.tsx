import { cn } from '@/lib/utils';
import { AgentRealtimeStatus } from '@/types/agent/agent';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatusLabelProps {
  realtimeStatus?: AgentRealtimeStatus;
  className?: string;
}

export function RealtimeStatusLabel({ realtimeStatus, className }: RealtimeStatusLabelProps) {
  if (!realtimeStatus || !realtimeStatus.lastOnline) {
    return (
      <div
        className={cn(
          'inline-flex items-center px-2.5 py-1 bg-red-900/30 text-red-400 text-xs rounded-full font-medium',
          className,
        )}
      >
        <WifiOff className="h-3 w-3 mr-1.5" />
        <span>Offline</span>
      </div>
    );
  }

  const lastOnline = new Date(realtimeStatus.lastOnline);
  const timeAgo = formatDistanceToNow(lastOnline, { addSuffix: true });
  const isOnline = Date.now() - lastOnline.getTime() < 5 * 60 * 1000; // Consider online if less than 5 minutes ago

  if (isOnline) {
    return (
      <div
        className={cn(
          'inline-flex items-center px-2.5 py-1 bg-green-900/30 text-green-400 text-xs rounded-full font-medium',
          className,
        )}
      >
        <Wifi className="h-3 w-3 mr-1.5" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-1 bg-orange-900/30 text-orange-400 text-xs rounded-full font-medium',
        className,
      )}
    >
      <Clock className="h-3 w-3 mr-1.5" />
      <span>Last seen {timeAgo}</span>
    </div>
  );
}
