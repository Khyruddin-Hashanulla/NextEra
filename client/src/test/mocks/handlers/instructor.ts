import { http } from 'msw';
import { failure, success } from '../helpers';
import { sampleCourse } from '@/test/fixtures';

export const instructorHandlers = [
  http.get('/api/v1/instructor/dashboard', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({
      totalCourses: 3,
      totalStudents: 120,
      totalRevenue: 45000,
      totalEnrollments: 200,
      recentEnrollments: [],
      popularCourses: [],
      monthlyRevenue: [],
      recentReviews: [],
    });
  }),

  http.get('/api/v1/instructor/analytics', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({
      views: 1000,
      enrollments: 200,
      completionRate: 68,
      averageRating: 4.5,
      trafficSources: [],
      weeklyViews: [],
    });
  }),

  http.get('/api/v1/courses/instructor', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success([sampleCourse]);
  }),

  http.get('/api/v1/instructor/my-subscription', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({
      status: 'active',
      plan: { name: 'pro', features: { unlimitedCourses: true, advancedAnalytics: true } },
      endDate: '2026-12-31T00:00:00.000Z',
    });
  }),

  http.get('/api/v1/instructor/subscription', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({ subscriptionStatus: 'active', subscriptionExpiry: '2026-12-31T00:00:00.000Z' });
  }),
];
