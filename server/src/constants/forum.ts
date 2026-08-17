export const FORUM_CATEGORY_SLUGS = [
  'general',
  'programming',
  'dsa',
  'web-development',
  'mern',
  'java',
  'career',
  'interviews',
  'projects',
  'courses',
  'resources',
  'announcements',
] as const;

export type ForumCategorySlug = (typeof FORUM_CATEGORY_SLUGS)[number];

export const FORUM_CATEGORIES: { slug: ForumCategorySlug; name: string }[] = [
  { slug: 'general', name: 'General Discussion' },
  { slug: 'programming', name: 'Programming' },
  { slug: 'dsa', name: 'Data Structures & Algorithms' },
  { slug: 'web-development', name: 'Web Development' },
  { slug: 'mern', name: 'MERN Stack' },
  { slug: 'java', name: 'Java' },
  { slug: 'career', name: 'Career & Jobs' },
  { slug: 'interviews', name: 'Interview Preparation' },
  { slug: 'projects', name: 'Projects' },
  { slug: 'courses', name: 'Courses' },
  { slug: 'resources', name: 'Learning Resources' },
  { slug: 'announcements', name: 'Announcements' },
];

export const FORUM_CATEGORY_NAMES: Record<ForumCategorySlug, string> = Object.fromEntries(
  FORUM_CATEGORIES.map((c) => [c.slug, c.name])
) as Record<ForumCategorySlug, string>;

export const FORUM_SORTS = ['latest', 'active', 'viewed', 'discussed', 'trending'] as const;

export type ForumSort = (typeof FORUM_SORTS)[number];