import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '@/api/endpoints/student';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseGridSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronDown, BookOpen, Star, Users, Clock } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import type { MockCourse } from '@/mocks/types';

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('popular');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-courses', page, search, level, category, sort],
    queryFn: ({ signal }) => studentApi.listCourses({ 
      search, 
      level: level || undefined, 
      category: category || undefined,
      sort,
      page, 
      limit: 12 
    }, signal).then(r => r.data.data),
    placeholderData: (previousData) => previousData,
  });

  const courses = data?.courses || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.pages || 1;

  const { data: categoriesData } = useQuery({
    queryKey: ['course-categories'],
    queryFn: ({ signal }) => studentApi.listCourses({ limit: 100 }, signal).then(r => {
      const cats = new Set<string>();
      r.data.data.courses.forEach((c: any) => {
        if (c.category?.name) cats.add(c.category.name);
        else if (typeof c.category === 'string') cats.add(c.category);
      });
      return Array.from(cats).sort();
    }),
  });

  const categories = categoriesData || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter: string, value: string) => {
    if (filter === 'level') setLevel(value);
    else if (filter === 'category') setCategory(value);
    else if (filter === 'sort') setSort(value);
    setPage(1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <CourseGridSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load courses"
        message="Please try again or check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <SEO title="Courses" description="Browse our comprehensive catalog of web development, programming, and technology courses." canonical={ROUTES.COURSES} />
      <StructuredData schemas={[
        breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Courses', path: '/courses' },
        ]),
      ]} />
      {/* Page Header */}
      <Section size="sm" background="gradient">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
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
              Find the perfect course to advance your career. Filter by level, category, or search topics.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* Filters & Courses */}
      <Section size="lg">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 space-y-6 p-6 rounded-2xl bg-card border"
              >
                {/* Search */}
                <div>
                  <label htmlFor="search" className="label-base">Search Courses</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search topics..."
                      value={search}
                      onChange={handleSearch}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Level Filter */}
                <div>
                  <label htmlFor="level" className="label-base">Level</label>
                  <Select
                    value={level}
                    onValueChange={(value) => handleFilterChange('level', value)}
                  >
                    <SelectTrigger id="level" className="mt-1">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div>
                    <label htmlFor="category" className="label-base">Category</label>
                    <Select
                      value={category}
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sort */}
                <div>
                  <label htmlFor="sort" className="label-base">Sort By</label>
                  <Select
                    value={sort}
                    onValueChange={(value) => handleFilterChange('sort', value)}
                  >
                    <SelectTrigger id="sort" className="mt-1">
                      <SelectValue placeholder="Popular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="duration">Shortest Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(search || level || category || sort !== 'popular') && (
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                    setSearch(''); setLevel(''); setCategory(''); setSort('popular'); setPage(1);
                  }}>
                    <Filter className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </motion.div>
            </aside>

            {/* Courses Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{pagination?.total || courses.length} courses found</span>
                  {search && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">"{search}"</span>}
                  {level && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">{level}</span>}
                  {category && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{category}</span>}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {courses.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-16"
                  >
                    <EmptyState
                      icon={<BookOpen className="h-12 w-12 text-muted-foreground/50" />}
                      title="No courses found"
                      description="Try adjusting your search or filters to find what you're looking for."
                      action={{ label: 'Clear Filters', href: '/courses', variant: 'outline' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {courses.map((course: MockCourse, index: number) => (
                      <motion.div
                        key={course._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <CourseCard course={course} variant="default" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10"
                  >
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      showPageNumbers
                      siblingCount={1}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section size="sm" background="gradient">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-heading-md font-semibold">Can't find what you're looking for?</h2>
            <p className="mt-3 text-muted-foreground">Request a course topic and we'll notify you when it's available.</p>
            <Button asChild variant="outline" className="mt-4" size="lg">
              <Link to="/contact">Request a Course</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}