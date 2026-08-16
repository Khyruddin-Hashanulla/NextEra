import { Skeleton, SkeletonCard, SkeletonList, SkeletonText, SkeletonTable } from '@/components/ui/skeleton';

export { SkeletonTable, SkeletonList, SkeletonText, SkeletonCard, Skeleton };
export { DashboardSkeleton, AnalyticsSkeleton } from '@/components/skeletons/DashboardSkeleton';
export { CourseDetailSkeleton, CoursePlayerSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
export { BlogDetailSkeleton, CodingProblemSkeleton } from '@/components/skeletons/BlogDetailSkeleton';
export {
  FormSkeleton,
  ProfileSkeleton,
  SettingsSkeleton,
  EditCourseSkeleton,
} from '@/components/skeletons/FormSkeleton';
export {
  CertificateSkeleton,
  CertificateVerifySkeleton,
  SubscriptionsSkeleton,
} from '@/components/skeletons/CertificateSkeleton';
export {
  ListSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  NotificationListSkeleton,
} from '@/components/skeletons/ListSkeleton';

export function CourseCardSkeleton() {
  return <SkeletonCard className="overflow-hidden" />;
}

export function BlogCardSkeleton() {
  return <SkeletonCard className="overflow-hidden" />;
}

export function InstructorCardSkeleton() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative h-24 bg-gradient-to-br from-primary/30 to-aura-primary/20" aria-hidden="true" />
      <div className="-mt-10 flex justify-center px-6">
        <Skeleton className="h-20 w-20 rounded-full ring-4 ring-card" />
      </div>
      <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-3 text-center">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <div className="mt-4 w-full border-t border-border pt-4">
          <Skeleton className="mx-auto h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CourseFlipCardSkeleton() {
  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-hidden="true">
      <Skeleton className="h-44 w-full shrink-0 rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CourseFlipGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CourseFlipCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BlogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function InstructorGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <InstructorCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl">
      <SkeletonText lines={1} className="max-w-xs" />
      <SkeletonText lines={2} className="max-w-2xl" />
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <CourseGridSkeleton count={3} />
    </div>
  );
}
