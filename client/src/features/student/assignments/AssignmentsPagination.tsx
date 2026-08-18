import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AssignmentsPaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AssignmentsPagination({ page, pages, total, onPageChange }: AssignmentsPaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {pages} · {total} assignments
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}