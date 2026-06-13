import { CardInner } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ButtonSkeleton } from '@/components/ui/skeleton-loaders';

interface TransactionCardSkeletonProps {
  hasTwoButtons?: boolean;
}

export function TransactionCardSkeleton({ hasTwoButtons = true }: TransactionCardSkeletonProps) {
  return (
    <CardInner className="bg-act-2-midnight-blue">
      <div className="flex items-start space-x-3 mb-4">
        <div className="p-2 bg-white/[0.03] rounded-lg">
          <Skeleton className="h-5 w-5 bg-act-2-dark-gray-200 rounded-md" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-5 w-32 bg-act-2-dark-gray-200 rounded-md mb-2" />
              <Skeleton className="h-4 w-40 bg-act-2-dark-gray-200 rounded-md mb-2" />
              <div className="flex items-center mt-2">
                <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 rounded-full mr-1" />
                <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 bg-act-2-dark-gray-200 rounded-md" />
          </div>
        </div>
      </div>
      {hasTwoButtons ? (
        <div className="flex space-x-3">
          <div className="flex-1">
            <ButtonSkeleton />
          </div>
          <div className="flex-1">
            <ButtonSkeleton />
          </div>
        </div>
      ) : (
        <div className="w-full">
          <ButtonSkeleton />
        </div>
      )}
    </CardInner>
  );
}
