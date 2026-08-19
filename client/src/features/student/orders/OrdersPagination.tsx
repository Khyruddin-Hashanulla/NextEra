import { Pagination } from '@/components/ui/pagination';

interface OrdersPaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function OrdersPagination({ page, pages, total, onPageChange }: OrdersPaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {pages} · {total} orders
      </p>
      <Pagination currentPage={page} totalPages={pages} onPageChange={onPageChange} />
    </div>
  );
}