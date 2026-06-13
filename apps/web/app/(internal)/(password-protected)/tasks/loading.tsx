import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton-loaders';
export default function TasksLoading() {
  return (
    <div>

      <PageHeaderSkeleton />

      {/* Tasks filter bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-24 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-24 bg-act-2-dark-blue-gray rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-36 bg-act-2-dark-blue-gray rounded-md" />
        </div>
      </div>

      {/* Tasks list */}
      <CardSkeleton hasTitle={false}>
        <div className="space-y-4">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-5 gap-4 pb-2 border-b border-act-2-gray-dark">
            <Skeleton className="h-5 w-20 bg-act-2-dark-blue-gray" />
            <Skeleton className="h-5 w-20 bg-act-2-dark-blue-gray" />
            <Skeleton className="h-5 w-20 bg-act-2-dark-blue-gray" />
            <Skeleton className="h-5 w-20 bg-act-2-dark-blue-gray" />
            <Skeleton className="h-5 w-20 bg-act-2-dark-blue-gray" />
          </div>

          {/* Task rows */}
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-act-2-midnight-blue rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-act-2-dark-gray-200" />
                  <div>
                    <Skeleton className="h-5 w-32 bg-act-2-dark-gray-200" />
                    <Skeleton className="h-4 w-24 mt-1 bg-act-2-dark-gray-200" />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <Skeleton className="h-5 w-24 bg-act-2-dark-gray-200" />
                </div>

                <div className="md:col-span-1">
                  <Skeleton className="h-5 w-24 bg-act-2-dark-gray-200" />
                </div>

                <div className="md:col-span-1">
                  <Skeleton className="h-5 w-20 bg-act-2-dark-gray-200" />
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <Skeleton className="h-9 w-24 bg-act-2-dark-gray-200 rounded-md" />
                </div>
              </div>
            ))}
        </div>
      </CardSkeleton>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <Skeleton className="h-5 w-32 bg-act-2-dark-blue-gray" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-10 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-10 bg-act-2-dark-blue-gray rounded-md" />
        </div>
      </div>
    </div>
  );
}
