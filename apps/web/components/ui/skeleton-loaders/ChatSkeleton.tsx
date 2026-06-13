import { CardInner } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Message bubble skeleton
export function MessageBubbleSkeleton({ isAI = true }: { isAI?: boolean }) {
  return (
    <div className={`flex items-start space-x-3 max-w-[80%] ${!isAI && 'justify-end ml-auto'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-lg bg-act-elevated flex items-center justify-center flex-shrink-0">
          <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 rounded-md" />
        </div>
      )}
      <div className={!isAI ? 'text-right' : ''}>
        <div className={`${isAI ? 'bg-white/5' : 'bg-purple-500 bg-opacity-20'} rounded-lg p-3`}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 bg-act-2-dark-gray-200 rounded-md" />
            <Skeleton className="h-4 w-32 bg-act-2-dark-gray-200 rounded-md" />
          </div>
        </div>
        <Skeleton
          className={`h-3 w-20 bg-act-2-dark-gray-200 rounded-md mt-1 ${!isAI && 'ml-auto'}`}
        />
      </div>
    </div>
  );
}

// Chat list item skeleton
export function ChatListItemSkeleton() {
  return (
    <div className="p-3 hover:bg-act-base-dark cursor-pointer border-b border-[#2A2438]">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-act-elevated flex items-center justify-center">
            <Skeleton className="h-5 w-5 bg-act-2-dark-gray-200 rounded-md" />
          </div>
          <Skeleton className="absolute -bottom-1 -right-1 w-3 h-3 bg-act-2-dark-gray-200 rounded-full border-2 border-act-surface" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28 bg-act-2-dark-gray-200 rounded-md" />
            <Skeleton className="h-4 w-10 bg-act-2-dark-gray-200 rounded-md" />
          </div>
          <Skeleton className="h-3 w-40 bg-act-2-dark-gray-200 rounded-md mt-1" />
        </div>
      </div>
    </div>
  );
}

// Task info skeleton
export function TaskInfoSkeleton() {
  return (
    <CardInner className="bg-white/5">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white/[0.03] rounded-lg">
          <Skeleton className="h-5 w-5 bg-act-2-dark-gray-200 rounded-md" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 bg-act-2-dark-gray-200 rounded-md mb-2" />
          <div className="flex items-center mt-1">
            <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 rounded-full mr-1" />
            <Skeleton className="h-3 w-20 bg-act-2-dark-gray-200 rounded-md" />
          </div>
          <div className="flex items-center mt-2">
            <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 rounded-full mr-1" />
            <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200 rounded-md" />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between mb-1">
          <Skeleton className="h-4 w-16 bg-act-2-dark-gray-200 rounded-md" />
          <Skeleton className="h-4 w-10 bg-act-2-dark-gray-200 rounded-md" />
        </div>
        <div className="w-full bg-act-elevated rounded-full h-2">
          <Skeleton className="h-2 w-3/4 bg-act-2-dark-gray-200 rounded-full" />
        </div>
      </div>
    </CardInner>
  );
}

// Agent info card skeleton
export function AgentInfoSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center">
          <Skeleton className="h-6 w-6 bg-act-2-dark-gray-200 rounded-md" />
        </div>
        <div>
          <Skeleton className="h-5 w-32 bg-act-2-dark-gray-200 rounded-md mb-2" />
          <div className="flex items-center mt-1">
            <Skeleton className="h-4 w-4 bg-act-2-dark-gray-200 rounded-full mr-1" />
            <Skeleton className="h-4 w-20 bg-act-2-dark-gray-200 rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-2">
          <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200 rounded-md mb-1" />
          <Skeleton className="h-5 w-12 bg-act-2-dark-gray-200 rounded-md" />
        </div>
        <div className="bg-white/[0.03] rounded-lg p-2">
          <Skeleton className="h-4 w-24 bg-act-2-dark-gray-200 rounded-md mb-1" />
          <Skeleton className="h-5 w-16 bg-act-2-dark-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  );
}
