import { http } from 'msw';
import { failure, success } from '../helpers';
import { sampleCourse, freeCourse } from '@/test/fixtures';

const courses = [sampleCourse, freeCourse];

export const courseHandlers = [
  http.get('/api/v1/student/courses', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const level = url.searchParams.get('level');
    const category = url.searchParams.get('category');

    let filtered = courses;
    if (search) filtered = filtered.filter((c) => c.title.toLowerCase().includes(search));
    if (level) filtered = filtered.filter((c) => c.level === level);
    if (category) {
      filtered = filtered.filter((c) => {
        const catName = typeof c.category === 'string' ? c.category : c.category?.name;
        return catName === category;
      });
    }

    return success({
      courses: filtered,
      pagination: { page: 1, pages: 1, total: filtered.length, limit: 12 },
    });
  }),

  http.get('/api/v1/student/courses/:id', ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    const course = courses.find((c) => c._id === params.id);
    if (!course) return failure('Course not found', 404);
    return success({
      course,
      curriculum: [],
      isEnrolled: Boolean(auth),
      enrollment: null,
    });
  }),

  http.get('/api/v1/student/my-courses', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success([{ ...sampleCourse, progress: 42 }]);
  }),
];
