import { cn } from '@/lib/utils';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonText, SkeletonTable } from '@/components/ui/skeleton';

export { SkeletonTable, SkeletonList, SkeletonText, SkeletonCard, Skeleton };
export { DashboardSkeleton, AnalyticsSkeleton } from '@/components/skeletons/DashboardSkeleton';
export { CourseDetailSkeleton, CoursePlayerSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
export { BlogDetailSkeleton, CodingProblemSkeleton } from '@/components/skeletons/BlogDetailSkeleton';
export { FormSkeleton, ProfileSkeleton, SettingsSkeleton, EditCourseSkeleton } from '@/components/skeletons/FormSkeleton';
export { CertificateSkeleton, CertificateVerifySkeleton, SubscriptionsSkeleton } from '@/components/skeletons/CertificateSkeleton';
export { ListSkeleton, TableSkeleton, CardGridSkeleton, NotificationListSkeleton } from '@/components/skeletons/ListSkeleton';

export function CourseCardSkeleton() {
  return (
    <SkeletonCard className="overflow-hidden" />
  );
}

export function BlogCardSkeleton() {
  return (
    <SkeletonCard className="overflow-hidden" />
  );
}

export function InstructorCardSkeleton() {
  return (
    <div className="flex flex-col items-center text-center p-6 space-y-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="space-y-2 w-full max-w-xs">
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-full" />
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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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