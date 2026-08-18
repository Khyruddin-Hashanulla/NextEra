import { Skeleton } from '@/components/ui/skeleton';

export function QuizHistorySkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading quiz history">
      <div className="min-w-0">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Skeleton className="h-0.5 w-full rounded-none" />
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Skeleton className="h-10 w-72 rounded-lg" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-center">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
                <Skeleton className="h-6 w-2/3" />
                <div className="flex gap-4">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 h-px bg-border" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3 p-6">
              <Skeleton className="h-3.5 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}