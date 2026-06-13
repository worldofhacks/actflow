import { Skeleton } from '@/components/ui/skeleton';

export function TaskSkeleton() {
  return (
    <div className="space-y-3 lg:space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-act-base-dark rounded-lg p-3 lg:p-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 lg:mb-4">
            <div className="w-full">
              <Skeleton className="h-5 w-48 bg-act-elevated mb-2" />
              <Skeleton className="h-4 w-32 bg-act-elevated" />
            </div>
            <div className="flex items-center space-x-2 mt-3 lg:mt-0">
              <Skeleton className="h-9 w-32 bg-act-elevated" />
            </div>
          </div>
          <div className="space-y-2 lg:space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <Skeleton className="h-4 w-36 bg-act-elevated" />
                <Skeleton className="h-4 w-10 bg-act-elevated" />
              </div>
              <Skeleton className="h-2 w-full bg-act-elevated rounded-full" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Skeleton className="h-4 w-24 bg-act-elevated" />
              <Skeleton className="h-4 w-16 bg-act-elevated" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
