import { Skeleton } from '@/components/ui/skeleton';

/** Full-page skeleton matching the redesigned instructor profile layout. */
export function InstructorPageSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary/10 via-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <Skeleton className="h-28 w-28 shrink-0 rounded-full sm:h-36 sm:w-36" />
              <div className="w-full max-w-xl space-y-4 text-center md:text-left">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-center gap-3 md:justify-start">
                  <Skeleton className="h-9 w-24 rounded-xl" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="h-48 rounded-2xl" aria-hidden="true">
              <div className="flex h-full flex-col justify-between p-6">
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
