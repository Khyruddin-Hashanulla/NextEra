import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, Home, Layers, SearchX } from 'lucide-react';
import { studentApi } from '@/api/endpoints/student';
import { categoryApi } from '@/api/endpoints/category';
import { QUERY_KEYS } from '@/lib/constants';
import { FlipCourseCard } from '@/components/course/FlipCourseCard';
import { Skeleton, CourseFlipGridSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import { getCategoryMeta } from '../components/categories/categoryMeta';
import type { Course } from '@/types/instructor';

interface CoursesListResponse {
  courses: Course[];
  total?: number;
  totalPages?: number;
  page?: number;
  pagination?: { total?: number; pages?: number; page?: number };
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [page, setPage] = useState(1);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: QUERY_KEYS.categories.list(),
    queryFn: ({ signal }) => categoryApi.listCategories(signal).then((r) => r.data.data),
  });

  const category = categories?.find((cat) => cat.slug === slug);

  const {
    data,
    isLoading: coursesLoading,
    error: coursesError,
    refetch,
  } = useQuery({
    queryKey: ['public-category-courses', category?._id ?? slug, page],
    queryFn: ({ signal }) =>
      studentApi
        .listCourses(
          {
            category: category?._id,
            sort: 'popular',
            page,
            limit: 9,
          },
          signal
        )
        .then((r) => r.data.data as CoursesListResponse),
    enabled: Boolean(category),
    placeholderData: (previousData) => previousData,
  });

  const courses = data?.courses ?? [];
  const totalCourses = data?.pagination?.total ?? data?.total ?? courses.length;
  const totalPages = data?.pagination?.pages ?? data?.totalPages ?? 1;

  const { icon: CategoryIcon, description } = category ? getCategoryMeta(category.name) : { icon: Layers, description: '' };

  const notFound = !categoriesLoading && categories && !category;

  if (notFound) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Category Not Found"
          description="The category you are looking for does not exist."
          canonical={`/categories/${slug}`}
        />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center" role="alert">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <SearchX className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="text-heading-md font-semibold text-foreground">Category not found</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            The category you're looking for doesn't exist or may have been removed.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link to="/categories">
              <Layers className="h-4 w-4" aria-hidden="true" />
              Browse All Categories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${category?.name ?? 'Category'} Courses`}
        description={`Explore ${category?.name ?? 'our'} courses on NextEra. ${description || ''}`.trim()}
        canonical={`/categories/${slug}`}
      />
      {category && (
        <StructuredData
          schemas={[
            breadcrumbListSchema([
              { name: 'Home', path: '/' },
              { name: 'Categories', path: '/categories' },
              { name: category.name, path: `/categories/${category.slug}` },
            ]),
          ]}
        />
      )}
      <div className="min-h-screen overflow-x-clip">
        {/* Hero */}
        <Section size="sm" id="hero" className="relative overflow-hidden">
          <PageBackground variant="hero" className="absolute inset-0" />
          <Container>
            <div className="relative z-10 mx-auto max-w-5xl">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Link to="/" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                  <Home className="h-3.5 w-3.5" aria-hidden="true" />
                  Home
                </Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <Link to="/categories" className="transition-colors hover:text-foreground">
                  Categories
                </Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-medium text-foreground" aria-current="page">
                  {category?.name ?? '...'}
                </span>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-8 flex items-start gap-5 sm:items-center"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:h-16 sm:w-16">
                  <CategoryIcon className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-heading-lg font-semibold text-foreground sm:text-display-md">
                    {category?.name ?? 'Loading category...'}
                  </h1>
                  <p className="mt-2 max-w-2xl text-body text-muted-foreground text-balance">{description}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                {coursesLoading && !data ? (
                  <Skeleton className="h-8 w-40 rounded-full" />
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="font-semibold text-foreground">{totalCourses.toLocaleString()}</span>
                    {totalCourses === 1 ? 'course' : 'courses'}
                  </span>
                )}
              </motion.div>
            </div>
          </Container>
        </Section>

        {/* Courses */}
        <Section size="sm" id="courses" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-heading-md font-semibold text-foreground">
                  {category ? `Courses in ${category.name}` : 'Courses'}
                </h2>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/courses">View all courses</Link>
                </Button>
              </div>

              {coursesLoading && !data ? (
                <CourseFlipGridSkeleton count={9} />
              ) : coursesError ? (
                <EmptyState
                  icon={<SearchX className="h-12 w-12 text-muted-foreground/50" />}
                  title="Failed to load courses"
                  description="Something went wrong while loading this category's courses. Please try again."
                  action={{ label: 'Try Again', variant: 'outline', onClick: () => refetch() }}
                />
              ) : courses.length === 0 ? (
                <EmptyState
                  icon={<Layers className="h-12 w-12 text-muted-foreground/50" />}
                  title="No courses available in this category yet"
                  description="Courses are being added all the time. Check back soon or explore everything we offer."
                  action={{ label: 'Explore All Courses', href: '/courses' }}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => (
                      <FlipCourseCard key={course._id} course={course} />
                    ))}
                  </div>
                  {totalPages > 1 && (
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
                </>
              )}
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}