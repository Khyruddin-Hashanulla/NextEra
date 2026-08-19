import { Skeleton } from '@/components/ui/skeleton';

export function OrdersSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading your orders">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <Skeleton className="h-16 w-28 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 max-w-xs" />
              <Skeleton className="h-4 w-1/2 max-w-[200px]" />
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}