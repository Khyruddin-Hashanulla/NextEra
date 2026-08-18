import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import type { AssignmentOverviewResponse } from '@/types/student';

export function useAssignments(page: number, statusFilter: string) {
  return useQuery<AssignmentOverviewResponse>({
    queryKey: ['student', 'assignments', 'overview', page, statusFilter],
    queryFn: ({ signal }) =>
      studentApi
        .getAssignmentsOverview(
          { page, limit: 12, status: statusFilter === 'all' ? undefined : statusFilter },
          signal
        )
        .then((r) => r.data.data),
  });
}