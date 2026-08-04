import { cacheService } from './cache.service';
import { cacheKeys, cachePatterns } from './cacheKeys';

export class CacheManager {
  async invalidateCourseCache(courseId?: string, slug?: string): Promise<void> {
    const jobs: Promise<void>[] = [
      cacheService.invalidatePattern(cachePatterns.courseAll),
      cacheService.invalidatePattern(cachePatterns.courseListAll),
    ];
    if (courseId) {
      jobs.push(cacheService.del(cacheKeys.courseById(courseId)));
    }
    if (slug) {
      jobs.push(cacheService.del(cacheKeys.courseBySlug(slug)));
    }
    await Promise.allSettled(jobs);
  }

  async invalidateBlogCache(slug?: string): Promise<void> {
    const jobs: Promise<void>[] = [
      cacheService.invalidatePattern(cachePatterns.blogAll),
      cacheService.invalidatePattern(cachePatterns.blogListAll),
    ];
    if (slug) {
      jobs.push(cacheService.del(cacheKeys.blogBySlug(slug)));
    }
    await Promise.allSettled(jobs);
  }

  async invalidateStudentCache(userId: string): Promise<void> {
    await Promise.allSettled([
      cacheService.del(cacheKeys.studentDashboard(userId)),
      cacheService.del(cacheKeys.wishlist(userId)),
    ]);
  }

  async invalidateInstructorCache(userId: string): Promise<void> {
    await Promise.allSettled([
      cacheService.del(cacheKeys.instructorDashboard(userId)),
      cacheService.invalidatePattern(`instructor:revenue:${userId}:*`),
      cacheService.del(cacheKeys.instructorAnalytics(userId)),
      cacheService.del(cacheKeys.instructorRevenueDetail(userId)),
    ]);
  }

  async invalidateAdminCache(): Promise<void> {
    await Promise.allSettled([
      cacheService.invalidatePattern(cachePatterns.adminAll),
      cacheService.invalidatePattern(cachePatterns.revenueAll),
    ]);
  }

  async invalidateRevenueCache(): Promise<void> {
    await Promise.allSettled([
      cacheService.invalidatePattern(cachePatterns.revenueAll),
      cacheService.invalidatePattern(cachePatterns.adminAll),
    ]);
  }

  async invalidateStudentCourseList(): Promise<void> {
    await cacheService.invalidatePattern('student:courses:*');
  }
}

export const cacheManager = new CacheManager();
