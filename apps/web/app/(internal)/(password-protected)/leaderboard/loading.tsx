import { Skeleton } from '@/components/ui/skeleton';
import { PageHeaderSkeleton } from '@/components/ui/skeleton-loaders';

/**
 * Bounded loading state for the leaderboard route. The reputation API responds
 * fast from fixtures, so this is only a brief flash — never an unbounded spinner.
 */
export default function LeaderboardLoading() {
  return (
    <div>
      <PageHeaderSkeleton />

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[68px] w-full rounded-2xl bg-act-2-dark-blue-gray"
          />
        ))}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-full rounded-xl bg-act-2-dark-blue-gray sm:max-w-md" />
        <Skeleton className="h-7 w-28 rounded-full bg-act-2-dark-blue-gray" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/5 px-4 py-4 last:border-0"
          >
            <Skeleton className="h-4 w-4 bg-act-2-dark-blue-gray" />
            <Skeleton className="h-8 w-8 rounded-full bg-act-2-dark-blue-gray" />
            <Skeleton className="h-4 w-40 bg-act-2-dark-blue-gray" />
            <Skeleton className="ml-auto h-4 w-12 bg-act-2-dark-blue-gray" />
            <Skeleton className="hidden h-6 w-24 bg-act-2-dark-blue-gray sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
