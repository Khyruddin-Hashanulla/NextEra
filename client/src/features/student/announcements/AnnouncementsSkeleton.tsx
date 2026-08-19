import { Skeleton } from '@/components/ui/skeleton';

export function AnnouncementsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3.5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-24 shrink-0" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}