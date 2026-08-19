import { Pagination } from '@/components/ui/pagination';

interface AnnouncementsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AnnouncementsPagination({ page, totalPages, total, onPageChange }: AnnouncementsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {totalPages} · {total} announcements
      </p>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}