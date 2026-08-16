import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { studentApi } from '@/api/endpoints/student';
import { FlipCourseCard } from '@/components/course/FlipCourseCard';
import { Skeleton, CourseFlipGridSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Section, Container } from '@/components/common/Section';
import { ROUTES } from '@/lib/constants';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import type { Course } from '@/types/instructor';

interface CoursesListResponse {
  courses: Course[];
  total?: number;
  totalPages?: number;
  page?: number;
  pagination?: { total?: number; pages?: number; page?: number };
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'duration', label: 'Shortest Duration' },
];

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('popular');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-courses', page, search, level, category, sort],
    queryFn: ({ signal }) =>
      studentApi
        .listCourses(
          {
            search,
            level: level || undefined,
            category: category || undefined,
            sort,
            page,
            limit: 12,
          },
          signal
        )
        .then((r) => r.data.data as CoursesListResponse),
    placeholderData: (previousData) => previousData,
  });

  const courses = data?.courses || [];
  const totalCourses = data?.pagination?.total ?? data?.total ?? courses.length;
  const totalPages = data?.pagination?.pages ?? data?.totalPages ?? 1;

  const { data: categoriesData } = useQuery({
    queryKey: ['course-categories'],
    queryFn: ({ signal }) =>
      studentApi.listCourses({ limit: 100 }, signal).then((r) => {
        const cats = new Map<string, string>();
        r.data.data.courses.forEach((c: Course) => {
          if (c.category && typeof c.category === 'object' && c.category._id && c.category.name) {
            cats.set(String(c.category._id), c.category.name);
          } else if (typeof c.category === 'string') {
            cats.set(c.category, c.category);
          }
        });
        return Array.from(cats, ([value, label]) => ({ value, label })).sort((a, b) =>
          a.label.localeCompare(b.label)
        );
      }),
  });

  const categories = categoriesData || [];

  const categoryLabel = categories.find((c) => c.value === category)?.label ?? category;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter: 'level' | 'category' | 'sort', value: string) => {
    if (filter === 'level') setLevel(value);
    else if (filter === 'category') setCategory(value);
    else if (filter === 'sort') setSort(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setLevel('');
    setCategory('');
    setSort('popular');
    setPage(1);
  };

  const activeFilterChips = [
    { key: 'search', label: search ? `"${search}"` : '', filter: 'search' as const },
    { key: 'level', label: level, filter: 'level' as const },
    { key: 'category', label: category ? categoryLabel : '', filter: 'category' as const },
  ].filter((chip) => chip.label);

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen">
        <Section size="sm" background="gradient">
          <Container>
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <Skeleton className="mx-auto h-9 w-72" />
              <Skeleton className="mx-auto h-4 w-full max-w-xl" />
              <Skeleton className="mx-auto h-4 w-52" />
            </div>
          </Container>
        </Section>
        <Section size="lg">
          <Container>
            <div className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-44" />
              </div>
            </div>
            <CourseFlipGridSkeleton count={12} />
          </Container>
        </Section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Courses"
          description="Browse our comprehensive catalog of web development, programming, and technology courses."
          canonical={ROUTES.COURSES}
        />
        <ErrorState
          title="Failed to load courses"
          message="Please try again or check your connection."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO
        title="Courses"
        description="Browse our comprehensive catalog of web development, programming, and technology courses."
        canonical={ROUTES.COURSES}
      />
      <StructuredData
        schemas={[
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Courses', path: '/courses' },
          ]),
        ]}
      />

      {/* Page Header */}
      <Section size="sm" background="gradient">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-heading-lg font-semibold text-foreground"
            >
              Explore All Courses
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-body-lg text-muted-foreground"
            >
              Learn practical skills from industry-focused courses designed to help you grow.
            </motion.p>
            {totalCourses > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-5"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                  {totalCourses.toLocaleString()} courses
                </span>
              </motion.p>
            )}
          </div>
        </Container>
      </Section>

      {/* Discovery Toolbar & Courses */}
      <Section size="lg" className="pt-0 sm:pt-0 lg:pt-0">
        <Container>
          <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
              <div>
                <label htmlFor="course-search" className="label-base">
                  Search Courses
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="course-search"
                    type="search"
                    placeholder="Search topics..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-9"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <label htmlFor="category" className="label-base">
                    Category
                  </label>
                  <Select value={category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger id="category" className="w-full md:w-44">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label htmlFor="level" className="label-base">
                  Level
                </label>
                <Select value={level} onValueChange={(value) => handleFilterChange('level', value)}>
                  <SelectTrigger id="level" className="w-full md:w-40">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    {LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="sort" className="label-base">
                  Sort By
                </label>
                <Select value={sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                  <SelectTrigger id="sort" className="w-full md:w-48">
                    <SelectValue placeholder="Most Popular" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(activeFilterChips.length > 0 || sort !== 'popular') && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Active filters
                </span>
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => {
                      if (chip.filter === 'search') setSearch('');
                      else if (chip.filter === 'level') setLevel('');
                      else setCategory('');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="capitalize">{chip.label}</span>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                ))}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>

          {/* Results header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalCourses.toLocaleString()}</span> courses found
            </p>
          </div>

          {/* Grid / Empty / Error */}
          {courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12 text-muted-foreground/50" />}
              title="No courses found"
              description="Try changing your search or filters to find what you're looking for."
              action={{ label: 'Clear Filters', variant: 'outline', onClick: clearFilters }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <FlipCourseCard key={course._id} course={course} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && courses.length > 0 && (
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                showPageNumbers
                siblingCount={1}
              />
            </div>
          )}
        </Container>
      </Section>

      {/* CTA */}
      <Section size="sm" background="gradient">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-heading-md font-semibold">Can't find what you're looking for?</h2>
            <p className="mt-3 text-muted-foreground">
              Request a course topic and we'll notify you when it's available.
            </p>
            <Button asChild variant="outline" className="mt-4" size="lg">
              <Link to="/contact">Request a Course</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}