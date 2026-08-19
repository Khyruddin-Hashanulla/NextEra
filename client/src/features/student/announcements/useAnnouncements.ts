import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import type { StudentAnnouncementsResponse } from '@/types/student';

export function useAnnouncements(page: number) {
  return useQuery<StudentAnnouncementsResponse>({
    queryKey: ['student', 'announcements', page],
    queryFn: ({ signal }) => studentApi.listAnnouncements({ page, limit: 10 }, signal).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
}