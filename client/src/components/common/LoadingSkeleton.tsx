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
      <div className="flex items-center justify-between px-5 pt-4" aria-hidden="true">
        <Skeleton className="h-3 w-14 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
      <div className="px-5 pt-3" aria-hidden="true">
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
      <div className="flex flex-1 flex-col items-center px-5 pb-0 pt-4 text-center" aria-hidden="true">
        <Skeleton className="h-5 w-1/2 rounded-md" />
        <Skeleton className="mt-1.5 h-3 w-2/3 rounded-md" />
        <Skeleton className="mt-2 h-3 w-1/3 rounded-full" />
        <div className="mt-auto w-full pt-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <div className="mt-3 border-t border-success/15 bg-success/10 px-5 py-2.5" aria-hidden="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
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
