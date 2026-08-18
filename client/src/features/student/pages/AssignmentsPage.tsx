import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { AssignmentsHeader } from '@/features/student/assignments/AssignmentsHeader';
import { AssignmentFilters } from '@/features/student/assignments/AssignmentFilters';
import { AssignmentCard } from '@/features/student/assignments/AssignmentCard';
import { AssignmentsPagination } from '@/features/student/assignments/AssignmentsPagination';
import { AssignmentsSkeleton } from '@/features/student/assignments/AssignmentsSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { categorizeError } from '@/lib/error-utils';
import { ClipboardList } from 'lucide-react';

export function AssignmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'assignments', 'overview', page, statusFilter],
    queryFn: ({ signal }) =>
      studentApi
        .getAssignmentsOverview(
          { page, limit: 12, status: statusFilter === 'all' ? undefined : statusFilter },
          signal
        )
        .then((r) => r.data.data),
  });

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (isLoading) {
    return <AssignmentsSkeleton />;
  }

  if (error) {
    const category = categorizeError(error);
    return (
      <ErrorState
        title={category === 'network' ? 'Unable to reach the server' : 'Could not load assignments'}
        message={
          category === 'network'
            ? 'Check your internet connection and try again.'
            : 'Something went wrong while loading your assignments.'
        }
        onRetry={refetch}
      />
    );
  }

  const items = data?.assignments || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <AssignmentsHeader total={pagination?.total} />

      <AssignmentFilters value={statusFilter} onChange={handleFilterChange} />

      {!items.length ? (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7 text-primary" />}
          title={
            statusFilter === 'all'
              ? 'No assignments yet'
              : 'No assignments in this status'
          }
          description={
            statusFilter === 'all'
              ? 'You will see assignments here once your instructors publish them for your courses.'
              : 'Try switching to a different status filter to see more assignments.'
          }
          action={
            statusFilter === 'all'
              ? { label: 'Go to My Courses', href: '/student/my-courses' }
              : { label: 'View all assignments', onClick: () => handleFilterChange('all') }
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <AssignmentCard key={item._id} item={item} />
          ))}
        </div>
      )}

      {pagination && <AssignmentsPagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />}
    </div>
  );
}