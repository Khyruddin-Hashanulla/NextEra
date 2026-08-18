import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import type { EnrolledCourse } from '@/types/student';

export type CourseFilter = 'all' | 'in-progress' | 'completed';

export type CourseStatus = 'completed' | 'in-progress' | 'not-started';

export function useMyCourses() {
  return useQuery({
    queryKey: ['student', 'my-courses'],
    queryFn: () => studentApi.getMyCourses().then((r) => r.data.data),
    staleTime: 60_000,
  });
}

export function getCourseStatus(enrollment: EnrolledCourse): CourseStatus {
  if (enrollment.isCompleted) return 'completed';
  return (enrollment.completionPercentage ?? 0) > 0 ? 'in-progress' : 'not-started';
}

export function getCourseHref(enrollment: EnrolledCourse): string {
  return `/student/courses/${enrollment.course?._id}/learn`;
}

export function filterCourses(courses: EnrolledCourse[] | undefined, filter: CourseFilter): EnrolledCourse[] {
  if (!courses) return [];
  if (filter === 'in-progress') return courses.filter((e) => !e.isCompleted);
  if (filter === 'completed') return courses.filter((e) => e.isCompleted);
  return courses;
}

export function getCourseStats(courses: EnrolledCourse[] | undefined) {
  const all = courses ?? [];
  const completed = all.filter((e) => e.isCompleted).length;
  const inProgress = all.filter((e) => !e.isCompleted).length;
  return { total: all.length, inProgress, completed };
}

export function getContinueCourse(courses: EnrolledCourse[] | undefined): EnrolledCourse | undefined {
  if (!courses || courses.length === 0) return undefined;
  return (
    courses.find((e) => !e.isCompleted && (e.completionPercentage ?? 0) > 0) ??
    courses.find((e) => !e.isCompleted)
  );
}