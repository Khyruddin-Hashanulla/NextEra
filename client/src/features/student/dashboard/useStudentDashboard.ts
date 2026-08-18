import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { QUERY_KEYS } from '@/lib/constants';
import type { StudentDashboard, StudentDashboardEnrollment } from '@/types/student';

export function useStudentDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.student.dashboard(),
    queryFn: () => studentApi.getDashboard().then((r) => r.data.data),
    staleTime: 60_000,
  });
}

export function getCourseHref(enrollment: StudentDashboardEnrollment): string {
  return enrollment.isCompleted
    ? '/student/certificates'
    : `/student/courses/${enrollment.course?._id}/learn`;
}

export function getOverallCompletion(dashboard?: StudentDashboard): number {
  if (!dashboard || dashboard.totalCourses <= 0) return 0;
  return Math.round((dashboard.completedCourses / dashboard.totalCourses) * 100);
}

export function getAverageProgress(dashboard?: StudentDashboard): number {
  const enrollments = dashboard?.enrollments ?? [];
  if (enrollments.length === 0) return 0;
  const total = enrollments.reduce((sum, e) => sum + (e.completionPercentage || 0), 0);
  return Math.round(total / enrollments.length);
}