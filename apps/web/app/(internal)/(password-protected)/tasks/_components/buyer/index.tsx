import { PageHeader, PageHeaderDescription, PageHeaderTitle } from '@/components/page-header';
import { Suspense } from 'react';
import { ActiveTasks, ActiveTasksSkeleton } from './ActiveTasks';
import { QuickActions } from './QuickActions';
import { RecentNotifications } from './RecentNotifications';

export const BuyerTasks = () => {
  return (
    <div className="min-h-screen">
      <PageHeader>
        <PageHeaderTitle>Manage Your AI-Powered Tasks</PageHeaderTitle>
        <PageHeaderDescription>
          Track progress, performance, and AI agent efficiency in real-time.
        </PageHeaderDescription>
      </PageHeader>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Suspense fallback={<ActiveTasksSkeleton />}>
            <ActiveTasks />
          </Suspense>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <RecentNotifications />
        </Suspense>
      </div>
    </div>
  );
};
