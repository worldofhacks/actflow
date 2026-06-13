import { CardInner } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ButtonSkeleton } from '@/components/ui/skeleton-loaders';

// Common mobile quick stats skeleton that appears in most seller pages
export function MobileQuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CardInner>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200" />
          <Skeleton className="h-5 w-16 bg-act-2-dark-gray-200" />
        </div>
        <div className="flex items-center text-xs">
          <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 mr-1" />
          <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200" />
        </div>
      </CardInner>
      <CardInner>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20 bg-act-2-dark-gray-200" />
          <Skeleton className="h-5 w-12 bg-act-2-dark-gray-200" />
        </div>
        <div className="flex items-center text-xs">
          <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 mr-1" />
          <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200" />
        </div>
      </CardInner>
    </div>
  );
}

// Common mobile quick actions skeleton
export function MobileQuickActionsSkeleton() {
  return (
    <div className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 space-x-3 mt-4">
      <ButtonSkeleton />
      <ButtonSkeleton />
      <ButtonSkeleton />
    </div>
  );
}

// Common quick actions card skeleton that appears in most right sidebars
export function QuickActionsCardSkeleton() {
  return (
    <div className="space-y-3">
      <ButtonSkeleton />
      <ButtonSkeleton />
      <ButtonSkeleton />
    </div>
  );
}

// Common stat item skeleton with icon and value
export function StatItemSkeleton({
  labelWidth = 'w-24',
  valueWidth = 'w-20',
}: {
  labelWidth?: string;
  valueWidth?: string;
}) {
  return (
    <CardInner>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className={`h-4 ${labelWidth} bg-act-2-dark-gray-200`} />
        <Skeleton className={`h-5 ${valueWidth} bg-act-2-dark-gray-200`} />
      </div>
      <div className="flex items-center text-sm">
        <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 mr-1" />
        <Skeleton className="h-4 w-28 bg-act-2-dark-gray-200" />
      </div>
    </CardInner>
  );
}

// Common rating stars skeleton
export function RatingStarsSkeleton({ count = 5 }) {
  return (
    <div className="flex items-center space-x-1">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <Skeleton key={index} className="h-4 w-4 bg-act-2-dark-gray-200" />
        ))}
    </div>
  );
}

// Common item with icon and content skeleton
export function IconContentSkeleton({
  titleWidth = 'w-40',
  descriptionWidth = 'w-48',
  showButton = true,
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="p-2 bg-white/[0.03] rounded-lg">
        <Skeleton className="h-5 w-5 bg-act-2-dark-gray-200" />
      </div>
      <div>
        <Skeleton className={`h-5 ${titleWidth} bg-act-2-dark-gray-200 mb-2`} />
        <Skeleton className={`h-4 ${descriptionWidth} bg-act-2-dark-gray-200`} />
        {showButton && (
          <div className="mt-3">
            <ButtonSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}
