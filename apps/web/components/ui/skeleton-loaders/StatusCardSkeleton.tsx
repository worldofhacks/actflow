import { CardInner } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatusCardSkeleton() {
  return (
    <CardInner className="bg-act-2-midnight-blue">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-32 bg-act-2-dark-gray-200 rounded-md" />
        <Skeleton className="h-5 w-16 bg-act-2-dark-gray-200 rounded-md" />
      </div>
      <div className="flex items-center">
        <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 rounded-full mr-1" />
        <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200 rounded-md" />
      </div>
    </CardInner>
  );
}
