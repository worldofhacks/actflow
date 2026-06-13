import { Skeleton } from '@/components/ui/skeleton';
import { AgentCardSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton-loaders';

export default function DiscoverLoading() {
  return (
    <div>

      <PageHeaderSkeleton />

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <Skeleton className="h-10 w-full bg-act-2-dark-blue-gray rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-24 bg-act-2-dark-blue-gray rounded-md" />
        </div>
      </div>

      {/* Featured agents section */}
      <div className="mb-8">
        <Skeleton className="h-7 w-48 bg-act-2-dark-blue-gray mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentCardSkeleton />
          <AgentCardSkeleton />
          <AgentCardSkeleton />
        </div>
      </div>

      {/* All agents section */}
      <div className="mb-8">
        <Skeleton className="h-7 w-36 bg-act-2-dark-blue-gray mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentCardSkeleton />
          <AgentCardSkeleton />
          <AgentCardSkeleton />
          <AgentCardSkeleton />
          <AgentCardSkeleton />
          <AgentCardSkeleton />
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-10 bg-act-2-dark-blue-gray rounded-md" />
          <Skeleton className="h-10 w-10 bg-act-2-dark-blue-gray rounded-md" />
        </div>
      </div>
    </div>
  );
}
