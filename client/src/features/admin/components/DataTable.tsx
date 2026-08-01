import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface Column<T> {
  key?: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  accessor?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: { page: number; limit: number; total: number; pages: number };
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  pagination,
  totalPages: totalPagesProp,
  page: externalPage,
  onPageChange,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const totalPages = pagination?.pages || totalPagesProp || 1;
  const currentPage = externalPage ?? pagination?.page ?? 1;

  if (isLoading) {
    return (
      <div className="rounded-lg border" role="status" aria-live="polite">
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading table data</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center text-muted-foreground" role="status">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col, ci) => (
                <th key={col.key || ci} scope="col" className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item, index) => (
              <tr key={item._id || index} className="hover:bg-muted/30 transition-colors">
                {columns.map((col, ci) => (
                  <td key={col.key || ci} className={cn('px-4 py-3 text-sm', col.className)}>
                    {col.render ? col.render(item) : col.accessor ? col.accessor(item) : (item as any)[col.key || col.header] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(pagination || totalPages > 1) && onPageChange && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({pagination?.total || 0} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
