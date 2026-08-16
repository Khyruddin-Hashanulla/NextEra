import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Code2, Palette, Database, Brain, Briefcase, ShieldCheck, type LucideIcon } from 'lucide-react';

import { studentApi } from '@/api/endpoints/student';
import { blogApi } from '@/api/endpoints/blog';
import { QUERY_KEYS } from '@/lib/constants';
import type { MockCourse } from '@/mocks/types';

export interface HomeCategory {
  name: string;
  description: string;
  courseCount: number;
  icon: LucideIcon;
  gradient: string;
}

export interface HomeStats {
  courses: number;
  students: number;
  instructors: number;
  averageRating: number;
}

export interface HomeTestimonial {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  course: string;
  date: string;
  featured?: boolean;
}

interface CategoryMeta {
  icon: LucideIcon;
  gradient: string;
  description: string;
}

const CANONICAL_CATEGORIES: CategoryMeta[] = [
  {
    icon: Code2,
    gradient: 'from-sky-500 to-blue-600',
    description: 'Programming and web development fundamentals',
  },
  {
    icon: Palette,
    gradient: 'from-fuchsia-500 to-pink-600',
    description: 'UI/UX, graphic design and creative skills',
  },
  {
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    description: 'Data analysis, engineering and visualization',
  },
  {
    icon: Brain,
    gradient: 'from-violet-500 to-purple-600',
    description: 'Machine learning and AI applications',
  },
  {
    icon: Briefcase,
    gradient: 'from-amber-500 to-orange-600',
    description: 'Business, marketing and entrepreneurship',
  },
  {
    icon: ShieldCheck,
    gradient: 'from-rose-500 to-red-600',
    description: 'Cybersecurity, cloud and infrastructure',
  },
];

const CATEGORY_KEYWORDS: { keywords: string[]; meta: CategoryMeta }[] = [
  { keywords: ['programming', 'web', 'development', 'react', 'javascript', 'coding'], meta: CANONICAL_CATEGORIES[0] },
  { keywords: ['design', 'ui', 'ux', 'creative', 'graphic'], meta: CANONICAL_CATEGORIES[1] },
  { keywords: ['data', 'database', 'analytics'], meta: CANONICAL_CATEGORIES[2] },
  { keywords: ['ai', 'machine', 'intelligence', 'deep'], meta: CANONICAL_CATEGORIES[3] },
  { keywords: ['business', 'marketing', 'management', 'finance', 'entrepreneur'], meta: CANONICAL_CATEGORIES[4] },
  { keywords: ['security', 'cloud', 'devops', 'network'], meta: CANONICAL_CATEGORIES[5] },
];

const CANONICAL_FALLBACK_NAMES = ['Programming', 'Development', 'Design', 'Data Science', 'AI', 'Business'];

function getCategoryMeta(name: string, index: number): CategoryMeta {
  const normalized = name.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((k) => normalized.includes(k))) return entry.meta;
  }
  return CANONICAL_CATEGORIES[index % CANONICAL_CATEGORIES.length];
}

function getCourseCategoryName(course: MockCourse): string {
  if (course.category && typeof course.category === 'object' && course.category.name) {
    return course.category.name;
  }
  if (typeof course.category === 'string') return course.category;
  return 'General';
}

export function useHomePageData() {
  const featuredCoursesQuery = useQuery({
    queryKey: QUERY_KEYS.courses.list({ home: 'popular', limit: 4 }),
    queryFn: ({ signal }) => studentApi.listCourses({ limit: 4 }, signal).then((r) => r.data.data),
  });

  const allCoursesQuery = useQuery({
    queryKey: QUERY_KEYS.courses.list({ home: 'all', limit: 100 }),
    queryFn: ({ signal }) => studentApi.listCourses({ limit: 100 }, signal).then((r) => r.data.data),
  });

  const featuredBlogsQuery = useQuery({
    queryKey: QUERY_KEYS.blog.list({ home: 'featured', limit: 3 }),
    queryFn: ({ signal }) => blogApi.getFeatured(3, signal).then((r) => r.data.blogs),
  });

  const featuredCourses: MockCourse[] = useMemo(
    () => featuredCoursesQuery.data?.courses ?? [],
    [featuredCoursesQuery.data]
  );

  const allCourses: MockCourse[] = useMemo(() => allCoursesQuery.data?.courses ?? [], [allCoursesQuery.data]);

  const categories: HomeCategory[] = useMemo(() => {
    if (allCourses.length === 0) {
      return CANONICAL_FALLBACK_NAMES.map((name, index) => {
        const meta = getCategoryMeta(name, index);
        return {
          name,
          description: meta.description,
          courseCount: 0,
          icon: meta.icon,
          gradient: meta.gradient,
        };
      });
    }

    const counts = new Map<string, number>();
    allCourses.forEach((course) => {
      const name = getCourseCategoryName(course);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], index) => {
        const meta = getCategoryMeta(name, index);
        return {
          name,
          description: meta.description,
          courseCount: count,
          icon: meta.icon,
          gradient: meta.gradient,
        };
      });
  }, [allCourses]);

  const stats: HomeStats = useMemo(() => {
    const instructorIds = new Set<string>();
    let students = 0;
    let ratingSum = 0;
    let rated = 0;

    allCourses.forEach((course) => {
      if (course.instructor?._id) instructorIds.add(course.instructor._id);
      students += course.totalEnrollments ?? 0;
      if (typeof course.averageRating === 'number') {
        ratingSum += course.averageRating;
        rated += 1;
      }
    });

    return {
      courses: allCourses.length,
      students,
      instructors: instructorIds.size,
      averageRating: rated > 0 ? Math.round((ratingSum / rated) * 10) / 10 : 0,
    };
  }, [allCourses]);

  const fallbackTestimonials: HomeTestimonial[] = useMemo(
    () => [
      {
        id: 't1',
        name: 'Sarah Johnson',
        role: 'Software Engineer',
        avatarUrl: undefined,
        featured: true,
        content:
          'The structured curriculum and hands-on projects helped me move from beginner to a full-time developer. The instructors genuinely care about your progress.',
        rating: 5,
        course: 'React Masterclass',
        date: '2026-03-12',
      },
      {
        id: 't2',
        name: 'Mark Williams',
        role: 'Data Scientist',
        avatarUrl: undefined,
        content:
          'I finally understand concepts I struggled with for years. Real-world case studies and an amazing community made all the difference.',
        rating: 5,
        course: 'Machine Learning Bootcamp',
        date: '2026-02-20',
      },
      {
        id: 't3',
        name: 'Emily Chen',
        role: 'Product Manager',
        avatarUrl: undefined,
        content:
          'Best learning experience I have had. Courses are well-paced, certificates are recognized, and support answers within hours.',
        rating: 5,
        course: 'Product Design Fundamentals',
        date: '2026-01-28',
      },
      {
        id: 't4',
        name: 'Rahul Sharma',
        role: 'Frontend Developer',
        avatarUrl: undefined,
        content:
          'NextEra LMS helped me become a frontend developer. The projects felt real and the feedback was invaluable.',
        rating: 5,
        course: 'Full Stack Development',
        date: '2026-04-02',
      },
      {
        id: 't5',
        name: 'Priya Patel',
        role: 'Cloud Architect',
        avatarUrl: undefined,
        content:
          'The cloud path took me from zero to architecting production systems. Clear explanations and labs that actually deploy.',
        rating: 5,
        course: 'Cloud Computing Professional',
        date: '2026-05-15',
      },
      {
        id: 't6',
        name: 'Aisha Khan',
        role: 'DevOps Engineer',
        avatarUrl: undefined,
        content: 'Concise, practical and immediately applicable. The deployment labs are the best I have seen anywhere.',
        rating: 5,
        course: 'Docker & Kubernetes',
        date: '2026-06-10',
      },
      {
        id: 't7',
        name: 'Daniel Kim',
        role: 'Product Designer',
        avatarUrl: undefined,
        content:
          'The design critique workflows and real briefs made me portfolio-ready. Recruiters now notice my work instantly.',
        rating: 5,
        course: 'UI/UX Design Masterclass',
        date: '2026-05-02',
      },
      {
        id: 't8',
        name: 'Lucia Martinez',
        role: 'Data Analyst',
        avatarUrl: undefined,
        featured: true,
        content:
          'I moved from spreadsheets to building dashboards and pipelines in under six months. NextEra broke everything into digestible milestones, and the mentorship calls kept me accountable when motivation dipped. This platform genuinely changes how fast you can grow.',
        rating: 5,
        course: 'Data Analytics with Python',
        date: '2026-04-18',
      },
      {
        id: 't9',
        name: 'Omar Hassan',
        role: 'Backend Engineer',
        avatarUrl: undefined,
        content:
          'Advanced Node.js patterns explained clearly, with production-grade examples I now use daily at work.',
        rating: 5,
        course: 'Node.js Advanced Patterns',
        date: '2026-06-25',
      },
      {
        id: 't10',
        name: 'Grace Li',
        role: 'ML Engineer',
        avatarUrl: undefined,
        content:
          'The deep learning path finally made backpropagation and transformers click. Each module builds on the last without ever feeling rushed, and the graded notebooks gave me the confidence to apply for ML roles.',
        rating: 5,
        course: 'Deep Learning Specialization',
        date: '2026-03-30',
      },
    ],
    []
  );

  return {
    featuredCourses,
    featuredCoursesLoading: featuredCoursesQuery.isLoading,
    featuredCoursesError: featuredCoursesQuery.error,
    featuredCoursesRefetch: featuredCoursesQuery.refetch,
    allCoursesLoading: allCoursesQuery.isLoading,
    allCoursesError: allCoursesQuery.error,
    blogs: featuredBlogsQuery.data ?? [],
    blogsLoading: featuredBlogsQuery.isLoading,
    blogsError: featuredBlogsQuery.error,
    blogsRefetch: featuredBlogsQuery.refetch,
    categories,
    stats,
    testimonials: fallbackTestimonials,
    fallbackTestimonials,
  };
}
