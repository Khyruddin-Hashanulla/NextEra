import { Skeleton } from '@/components/ui/skeleton';

export function MyLearningSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading your courses">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-8 w-52" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row">
          <Skeleton className="aspect-video w-full rounded-lg sm:aspect-auto sm:w-2/5 lg:w-1/3" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-11 w-44 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-72 rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}