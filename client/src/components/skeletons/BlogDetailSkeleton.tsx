import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonText } from '@/components/ui/skeleton';

export function BlogDetailSkeleton() {
  return (
    <div className="min-h-screen" aria-hidden="true">
      <div className="bg-gradient-to-b from-background via-muted/50 to-background py-12 sm:py-16 lg:py-20">
        <div className="container-custom">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-3xl">
              <Skeleton className="h-4 w-28 rounded-full" />
              <div className="mt-6">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-4 h-4 w-2/3" />
              <div className="mt-7 flex items-center gap-5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-7 flex items-center gap-3">
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-10 sm:py-14">
        <div className="container-custom">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="pb-16 sm:pb-24 lg:pb-32">
        <div className="container-custom">
          <div className="mx-auto max-w-5xl">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
              <div className="space-y-4">
                <SkeletonText lines={14} />
              </div>
              <div className="mt-12 space-y-6 lg:mt-0">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CodingProblemSkeleton() {
  return (
    <div className="min-h-[60vh]" aria-hidden="true">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
