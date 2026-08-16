export const CACHE_NAMESPACES = {
  COURSE_DETAIL: 'course',
  COURSE_LIST: 'courses',
  BLOG_DETAIL: 'blog',
  BLOG_LIST: 'blogs',
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  REVENUE: 'revenue',
} as const;

export const CACHE_TTL = {
  COURSE_LIST: 60,
  COURSE_DETAIL: 300,
  BLOG_LIST: 60,
  BLOG_FEATURED: 60,
  BLOG_DETAIL: 300,
  BLOG_CATEGORIES: 300,
  BLOG_COMMENTS: 30,
  STUDENT_DASHBOARD: 30,
  STUDENT_COURSE_LIST: 60,
  WISHLIST: 60,
  INSTRUCTOR_DASHBOARD: 60,
  INSTRUCTOR_REVENUE: 120,
  INSTRUCTOR_ANALYTICS: 120,
  ADMIN_DASHBOARD: 30,
  ADMIN_ANALYTICS: 120,
  REVENUE_DASHBOARD: 60,
  REVENUE_SUMMARY: 60,
  INSTRUCTOR_SUBSCRIPTION_STATS: 60,
  INSTRUCTOR_ENTITLEMENTS: 30,
  INSTRUCTOR_PLAN_CATALOG: 60,
} as const;

function hashParams(params: Record<string, unknown>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}=${String(value)}`);
  return parts.length > 0 ? parts.join('&') : 'all';
}

export const cacheKeys = {
  courseList(filters: {
    search?: string;
    category?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
    sort?: string;
    featured?: boolean;
  }): string {
    return `courses:list:${hashParams({
      search: filters.search,
      category: filters.category,
      level: filters.level,
      status: filters.status,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
      featured: filters.featured,
    })}`;
  },

  courseById(courseId: string): string {
    return `course:${courseId}`;
  },

  courseBySlug(slug: string): string {
    return `course:slug:${slug}`;
  },

  blogList(options: { page: number; limit: number; category?: string; tag?: string }): string {
    return `blogs:list:${hashParams({ page: options.page, limit: options.limit, category: options.category, tag: options.tag })}`;
  },

  blogFeatured(limit: number): string {
    return `blogs:featured:${limit}`;
  },

  blogCategories(): string {
    return 'blogs:categories';
  },

  blogComments(blogId: string, page: number, limit: number): string {
    return `blog:comments:${blogId}:${page}:${limit}`;
  },

  blogBySlug(slug: string): string {
    return `blog:${slug}`;
  },

  studentDashboard(userId: string): string {
    return `student:dashboard:${userId}`;
  },

  studentCourseList(params: {
    search?: string;
    category?: string;
    level?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): string {
    return `student:courses:${hashParams(params)}`;
  },

  wishlist(userId: string): string {
    return `student:wishlist:${userId}`;
  },

  instructorDashboard(userId: string): string {
    return `instructor:dashboard:${userId}`;
  },

  instructorRevenue(userId: string, startDate?: string, endDate?: string): string {
    return `instructor:revenue:${userId}:${startDate || 'all'}:${endDate || 'all'}`;
  },

  instructorAnalytics(userId: string): string {
    return `instructor:analytics:${userId}`;
  },

  adminDashboard(): string {
    return 'admin:dashboard';
  },

  adminUserAnalytics(): string {
    return 'admin:analytics:users';
  },

  adminCourseAnalytics(): string {
    return 'admin:analytics:courses';
  },

  revenueDashboard(): string {
    return 'revenue:dashboard';
  },

  revenueSummary(): string {
    return 'revenue:summary';
  },

  instructorSubscriptionStats(): string {
    return 'revenue:subscriptions:stats';
  },

  instructorEntitlements(instructorId: string): string {
    return `instructor:entitlements:${instructorId}`;
  },

  instructorPlanCatalog(): string {
    return 'instructor:plans:catalog';
  },

  instructorRevenueDetail(instructorId: string): string {
    return `revenue:instructor:detail:${instructorId}`;
  },
} as const;

export const cachePatterns = {
  courseAll: 'course:*',
  courseListAll: 'courses:*',
  blogAll: 'blog:*',
  blogListAll: 'blogs:*',
  adminAll: 'admin:*',
  revenueAll: 'revenue:*',
} as const;
