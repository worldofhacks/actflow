import { Skeleton } from '@/components/ui/skeleton';
import {
  CardSkeleton,
  FormFieldSkeleton,
  PageHeaderSkeleton,
} from '@/components/ui/skeleton-loaders';

export default function AgentLoading() {
  return (
    <div>
      <PageHeaderSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - Agent setup form */}
        <div className="lg:col-span-2">
          <CardSkeleton hasTitle={false}>
            <div className="space-y-6">
              {/* Profile section */}
              <div>
                <Skeleton className="h-6 w-40 bg-act-2-dark-blue-gray mb-4" />
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-24 w-24 rounded-full bg-act-2-dark-blue-gray" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 bg-act-2-dark-blue-gray" />
                    <Skeleton className="h-10 w-32 bg-act-2-dark-blue-gray rounded-md" />
                  </div>
                </div>

                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </div>

              {/* Agent capabilities section */}
              <div className="border-t border-act-2-gray-dark pt-6">
                <Skeleton className="h-6 w-48 bg-act-2-dark-blue-gray mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </div>

              {/* Agent pricing section */}
              <div className="border-t border-act-2-gray-dark pt-6">
                <Skeleton className="h-6 w-32 bg-act-2-dark-blue-gray mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>
              </div>

              {/* Agent settings section */}
              <div className="border-t border-act-2-gray-dark pt-6">
                <Skeleton className="h-6 w-36 bg-act-2-dark-blue-gray mb-4" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48 bg-act-2-dark-blue-gray" />
                    <Skeleton className="h-6 w-12 rounded-full bg-act-2-dark-blue-gray" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48 bg-act-2-dark-blue-gray" />
                    <Skeleton className="h-6 w-12 rounded-full bg-act-2-dark-blue-gray" />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end pt-4">
                <Skeleton className="h-10 w-32 bg-act-2-dark-blue-gray rounded-md" />
              </div>
            </div>
          </CardSkeleton>
        </div>

        {/* Sidebar - Preview and guides */}
        <div className="lg:col-span-1">
          <CardSkeleton>
            <Skeleton className="h-6 w-full bg-act-2-dark-blue-gray mb-4" />
            <div className="p-4 bg-act-2-midnight-blue rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-full bg-act-2-dark-gray-200" />
                <div>
                  <Skeleton className="h-5 w-32 bg-act-2-dark-gray-200" />
                  <Skeleton className="h-4 w-24 mt-1 bg-act-2-dark-gray-200" />
                </div>
              </div>
              <Skeleton className="h-4 w-full bg-act-2-dark-gray-200 mb-2" />
              <Skeleton className="h-4 w-3/4 bg-act-2-dark-gray-200 mb-4" />
              <Skeleton className="h-10 w-full bg-act-2-dark-gray-200 rounded-md" />
            </div>
          </CardSkeleton>

          <CardSkeleton className="mt-6">
            <Skeleton className="h-6 w-48 bg-act-2-dark-blue-gray mb-4" />
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Skeleton className="h-6 w-6 rounded-full bg-act-2-dark-blue-gray mt-1" />
                <div>
                  <Skeleton className="h-5 w-48 bg-act-2-dark-blue-gray mb-1" />
                  <Skeleton className="h-4 w-full bg-act-2-dark-blue-gray" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="h-6 w-6 rounded-full bg-act-2-dark-blue-gray mt-1" />
                <div>
                  <Skeleton className="h-5 w-48 bg-act-2-dark-blue-gray mb-1" />
                  <Skeleton className="h-4 w-full bg-act-2-dark-blue-gray" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="h-6 w-6 rounded-full bg-act-2-dark-blue-gray mt-1" />
                <div>
                  <Skeleton className="h-5 w-48 bg-act-2-dark-blue-gray mb-1" />
                  <Skeleton className="h-4 w-full bg-act-2-dark-blue-gray" />
                </div>
              </div>
            </div>
          </CardSkeleton>
        </div>
      </div>
    </div>
  );
}
