import React from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import {
  AgentInfoSkeleton,
  ChatListItemSkeleton,
  MessageBubbleSkeleton,
  TaskInfoSkeleton,
} from './skeleton-loaders/ChatSkeleton';
import { StatusCardSkeleton } from './skeleton-loaders/StatusCardSkeleton';
import { TransactionCardSkeleton } from './skeleton-loaders/TransactionCardSkeleton';

// Page header skeleton with title and description
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-9 w-2/3 max-w-[400px] bg-act-2-dark-blue-gray" />
      <Skeleton className="h-5 w-4/5 max-w-[600px] mt-2 bg-act-2-dark-blue-gray" />
    </div>
  );
}

// Button action skeleton
export function ButtonSkeleton() {
  return <Skeleton className="h-10 w-full bg-act-2-dark-blue-gray rounded-md" />;
}

// Card skeleton with title
export function CardSkeleton({
  hasTitle = true,
  children,
  className = '',
}: {
  hasTitle?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border border-act-2-gray-dark ${className}`}>
      {hasTitle && (
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/3 bg-act-2-dark-blue-gray" />
            <Skeleton className="h-4 w-20 bg-act-2-dark-blue-gray" />
          </div>
        </CardHeader>
      )}
      <CardContent>
        {children || (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full bg-act-2-dark-blue-gray" />
            <Skeleton className="h-20 w-full bg-act-2-dark-blue-gray" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <Card className="border border-act-2-gray-dark">
      <CardContent>
        <div className="flex items-center space-x-3 mb-2">
          <Skeleton className="h-9 w-9 bg-act-2-dark-blue-gray rounded-lg" />
          <Skeleton className="h-5 w-1/2 bg-act-2-dark-blue-gray" />
        </div>
        <Skeleton className="h-8 w-1/3 bg-act-2-dark-blue-gray mt-2" />
      </CardContent>
    </Card>
  );
}

// Task item skeleton
export function TaskItemSkeleton() {
  return (
    <div className="p-4 bg-act-2-midnight-blue rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-9 w-9 bg-act-2-dark-gray-200 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-act-2-dark-gray-200" />
            <Skeleton className="h-4 w-48 bg-act-2-dark-gray-200" />
          </div>
        </div>
        <Skeleton className="h-5 w-20 bg-act-2-dark-gray-200" />
      </div>
    </div>
  );
}

// Notification item skeleton
export function NotificationItemSkeleton() {
  return (
    <div className="p-4 bg-act-2-midnight-blue rounded-lg">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-9 w-9 bg-act-2-dark-gray-200 rounded-lg" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-5 w-40 bg-act-2-dark-gray-200" />
          <Skeleton className="h-4 w-full bg-act-2-dark-gray-200" />
          <Skeleton className="h-3 w-16 bg-act-2-dark-gray-200 mt-1" />
        </div>
      </div>
    </div>
  );
}

// Agent card skeleton for discover page
export function AgentCardSkeleton() {
  return (
    <Card className="border border-act-2-gray-dark h-full min-h-[400px]">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton className="h-12 w-12 rounded-full bg-act-2-dark-blue-gray" />
          <div>
            <Skeleton className="h-6 w-32 bg-act-2-dark-blue-gray mb-1" />
            <Skeleton className="h-4 w-24 bg-act-2-dark-blue-gray" />
          </div>
        </div>

        {/* Agent description */}
        <div className="flex-grow">
          <Skeleton className="h-4 w-full bg-act-2-dark-blue-gray mb-3" />
          <Skeleton className="h-4 w-5/6 bg-act-2-dark-blue-gray mb-3" />
          <Skeleton className="h-4 w-4/6 bg-act-2-dark-blue-gray mb-3" />

          {/* Additional description lines for more height */}
          <Skeleton className="h-4 w-full bg-act-2-dark-blue-gray mb-3" />
          <Skeleton className="h-4 w-5/6 bg-act-2-dark-blue-gray mb-3" />
          <Skeleton className="h-4 w-3/4 bg-act-2-dark-blue-gray mb-3" />
          <Skeleton className="h-4 w-4/5 bg-act-2-dark-blue-gray mb-3" />

          {/* Features/Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="h-6 w-16 bg-act-2-dark-blue-gray rounded-full" />
            <Skeleton className="h-6 w-20 bg-act-2-dark-blue-gray rounded-full" />
            <Skeleton className="h-6 w-24 bg-act-2-dark-blue-gray rounded-full" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-act-2-gray-dark">
          <Skeleton className="h-5 w-20 bg-act-2-dark-blue-gray" />
          <Skeleton className="h-9 w-24 rounded-md bg-act-2-dark-blue-gray" />
        </div>
      </div>
    </Card>
  );
}

// Form field skeleton
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2 mb-4">
      <Skeleton className="h-5 w-24 bg-act-2-dark-blue-gray" />
      <Skeleton className="h-10 w-full bg-act-2-dark-blue-gray rounded-md" />
    </div>
  );
}

// Export the new components
export {
  AgentInfoSkeleton,
  ChatListItemSkeleton,
  MessageBubbleSkeleton,
  StatusCardSkeleton,
  TaskInfoSkeleton,
  TransactionCardSkeleton,
};
