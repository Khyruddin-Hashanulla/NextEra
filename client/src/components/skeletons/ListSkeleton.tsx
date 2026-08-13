import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ListSkeletonProps {
  rows?: number;
  height?: number;
  className?: string;
  hasHeader?: boolean;
}

export function ListSkeleton({ rows = 5, height = 20, className, hasHeader = true }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} aria-hidden="true">
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="w-full rounded-lg" style={{ height }} />
        ))}
      </div>
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  hasHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 4, className, hasHeader = true }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} aria-hidden="true">
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}
      <div className="rounded-xl border bg-card">
        <div className="space-y-0">
          <div className="grid gap-4 p-4 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, row) => (
            <div
              key={row}
              className="grid gap-4 p-4 border-b last:border-0"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, col) => (
                <Skeleton key={col} className="h-6 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface CardGridSkeletonProps {
  cards?: number;
  className?: string;
}

export function CardGridSkeleton({ cards = 6, className }: CardGridSkeletonProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)} aria-hidden="true">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
