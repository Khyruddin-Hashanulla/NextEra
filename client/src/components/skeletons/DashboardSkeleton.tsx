import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardSkeletonProps {
  className?: string;
}

function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 text-card-foreground shadow-sm', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    </div>
  );
}

interface ChartCardSkeletonProps {
  className?: string;
  height?: number;
}

function ChartCardSkeleton({ className, height = 64 }: ChartCardSkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}>
      <div className="flex items-center justify-between p-5 pb-0">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="p-5">
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </div>
    </div>
  );
}

interface PageTitleSkeletonProps {
  className?: string;
}

function PageTitleSkeleton({ className }: PageTitleSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function DashboardSkeleton({ statCards = 4, showCharts = true }: { statCards?: number; showCharts?: boolean }) {
  return (
    <div className="space-y-6" aria-hidden="true">
      <PageTitleSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: statCards }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {showCharts && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCardSkeleton height={72} />
          <ChartCardSkeleton height={72} />
        </div>
      )}
    </div>
  );
}

interface AnalyticsSkeletonProps {
  statCards?: number;
  className?: string;
}

export function AnalyticsSkeleton({ statCards = 4, className }: AnalyticsSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} aria-hidden="true">
      <PageTitleSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: statCards }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <ChartCardSkeleton height={80} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton height={56} />
        <ChartCardSkeleton height={56} />
      </div>
    </div>
  );
}
