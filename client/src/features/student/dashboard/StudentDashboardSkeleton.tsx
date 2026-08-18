import { Skeleton } from '@/components/ui/skeleton';

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true" role="status" aria-label="Loading your dashboard">
      <div>
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-2 h-8 w-64 sm:w-80" />
        <Skeleton className="mt-2 h-4 w-72 sm:w-96" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-6 w-44" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-2 w-full" />
                <Skeleton className="mt-4 h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-4 h-20 w-full rounded-xl" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}