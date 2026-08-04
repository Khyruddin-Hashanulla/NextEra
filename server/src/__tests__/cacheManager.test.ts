import { cacheManager } from '../cache/cacheManager';
import { cacheService } from '../cache/cache.service';
import { cacheKeys } from '../cache/cacheKeys';
import * as redisModule from '../config/redis';

jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(),
  isRedisReady: jest.fn(),
}));

const mockedIsRedisReady = redisModule.isRedisReady as jest.Mock;

const userId = 'user-1';
const instructorId = 'instructor-1';
const courseId = 'course-1';
const slug = 'intro-to-algebra';

describe('CacheManager invalidation', () => {
  beforeEach(async () => {
    await cacheService.flush();
    mockedIsRedisReady.mockReturnValue(false);
  });

  it('invalidates course detail and list caches', async () => {
    await cacheService.set(cacheKeys.courseById(courseId), { id: courseId }, { ttl: 60 });
    await cacheService.set(cacheKeys.courseBySlug(slug), { id: courseId }, { ttl: 60 });
    await cacheService.set(cacheKeys.courseList({ page: 1, limit: 10 }), { rows: [] }, { ttl: 60 });
    await cacheService.set(cacheKeys.blogList({ page: 1, limit: 5 }), { rows: [] }, { ttl: 60 });

    await cacheManager.invalidateCourseCache(courseId, slug);

    expect(await cacheService.exists(cacheKeys.courseById(courseId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.courseBySlug(slug))).toBe(false);
    expect(await cacheService.exists(cacheKeys.courseList({ page: 1, limit: 10 }))).toBe(false);
    expect(await cacheService.exists(cacheKeys.blogList({ page: 1, limit: 5 }))).toBe(true);
  });

  it('invalidates blog detail and list caches', async () => {
    await cacheService.set(cacheKeys.blogBySlug(slug), { slug }, { ttl: 60 });
    await cacheService.set(cacheKeys.blogList({ page: 1, limit: 5 }), { rows: [] }, { ttl: 60 });
    await cacheService.set(cacheKeys.blogFeatured(4), { rows: [] }, { ttl: 60 });
    await cacheService.set(cacheKeys.courseById(courseId), { id: courseId }, { ttl: 60 });

    await cacheManager.invalidateBlogCache(slug);

    expect(await cacheService.exists(cacheKeys.blogBySlug(slug))).toBe(false);
    expect(await cacheService.exists(cacheKeys.blogList({ page: 1, limit: 5 }))).toBe(false);
    expect(await cacheService.exists(cacheKeys.blogFeatured(4))).toBe(false);
    expect(await cacheService.exists(cacheKeys.courseById(courseId))).toBe(true);
  });

  it('invalidates student dashboard and wishlist caches for a user', async () => {
    await cacheService.set(cacheKeys.studentDashboard(userId), { courses: [] }, { ttl: 60 });
    await cacheService.set(cacheKeys.wishlist(userId), { ids: [] }, { ttl: 60 });
    await cacheService.set(cacheKeys.studentDashboard('other-user'), { courses: [] }, { ttl: 60 });

    await cacheManager.invalidateStudentCache(userId);

    expect(await cacheService.exists(cacheKeys.studentDashboard(userId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.wishlist(userId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.studentDashboard('other-user'))).toBe(true);
  });

  it('invalidates instructor dashboard, revenue, analytics, and revenue detail caches', async () => {
    await cacheService.set(cacheKeys.instructorDashboard(instructorId), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.instructorRevenue(instructorId, '2026-08-01', '2026-08-31'), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.instructorRevenue(instructorId), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.instructorAnalytics(instructorId), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.instructorRevenueDetail(instructorId), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.instructorDashboard('other-instructor'), {}, { ttl: 60 });

    await cacheManager.invalidateInstructorCache(instructorId);

    expect(await cacheService.exists(cacheKeys.instructorDashboard(instructorId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.instructorRevenue(instructorId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.instructorRevenue(instructorId, '2026-08-01', '2026-08-31'))).toBe(false);
    expect(await cacheService.exists(cacheKeys.instructorAnalytics(instructorId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.instructorRevenueDetail(instructorId))).toBe(false);
    expect(await cacheService.exists(cacheKeys.instructorDashboard('other-instructor'))).toBe(true);
  });

  it('invalidates admin and revenue caches together', async () => {
    await cacheService.set(cacheKeys.adminDashboard(), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.adminUserAnalytics(), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.revenueDashboard(), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.revenueSummary(), {}, { ttl: 60 });
    await cacheService.set(cacheKeys.instructorSubscriptionStats(), {}, { ttl: 60 });

    await cacheManager.invalidateAdminCache();
    await cacheManager.invalidateRevenueCache();

    expect(await cacheService.exists(cacheKeys.adminDashboard())).toBe(false);
    expect(await cacheService.exists(cacheKeys.adminUserAnalytics())).toBe(false);
    expect(await cacheService.exists(cacheKeys.revenueDashboard())).toBe(false);
    expect(await cacheService.exists(cacheKeys.revenueSummary())).toBe(false);
    expect(await cacheService.exists(cacheKeys.instructorSubscriptionStats())).toBe(false);
  });

  it('invalidates the student course list cache', async () => {
    await cacheService.set(cacheKeys.studentCourseList({ page: 1, limit: 10 }), { rows: [] }, { ttl: 60 });
    await cacheService.set(cacheKeys.studentCourseList({ page: 2, limit: 10, category: 'math' }), { rows: [] }, { ttl: 60 });

    await cacheManager.invalidateStudentCourseList();

    expect(await cacheService.exists(cacheKeys.studentCourseList({ page: 1, limit: 10 }))).toBe(false);
    expect(await cacheService.exists(cacheKeys.studentCourseList({ page: 2, limit: 10, category: 'math' }))).toBe(false);
  });
});
