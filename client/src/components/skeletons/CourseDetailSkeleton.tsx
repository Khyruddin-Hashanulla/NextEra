import { Skeleton } from '@/components/ui/skeleton';

export function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen" aria-hidden="true">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex items-center gap-4 pt-4 border-t">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-2 mb-8">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-1.5 w-1.5 rounded-full mt-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div>
              <Skeleton className="h-6 w-36 mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoursePlayerSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex h-14 items-center gap-3 border-b px-4 sm:px-5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="hidden h-5 w-28 sm:block" />
        <Skeleton className="h-5 w-1/3 max-w-xs" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="hidden h-3 w-24 sm:block" />
          <Skeleton className="h-8 w-8 rounded-md lg:hidden" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-7 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2 py-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
        <div className="hidden space-y-4 xl:block">
          <div className="sticky top-14 max-h-[calc(100vh-4.5rem)] space-y-3 overflow-hidden rounded-2xl border p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
