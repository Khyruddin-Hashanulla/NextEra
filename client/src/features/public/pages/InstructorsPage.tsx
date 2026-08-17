import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '@/api/endpoints/student';
import { InstructorCard } from '@/components/course/InstructorCard';
import { InstructorGridSkeleton, Skeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, SlidersHorizontal, X, Users } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import { Section, Container } from '@/components/common/Section';

interface Instructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  title?: string;
  experience?: string;
  specialties?: string[];
  rating?: number;
  studentsCount?: number;
  coursesCount?: number;
  totalReviews?: number;
}

export function InstructorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [sort, setSort] = useState('popular');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-instructors'],
    queryFn: ({ signal }) => studentApi.listInstructors(signal).then((r) => r.data.data || []),
    placeholderData: (previousData) => previousData,
  });

  const allInstructors = data || [];

  const filteredInstructors = allInstructors
    .filter(
      (instructor: Instructor) =>
        !search ||
        instructor.name?.toLowerCase().includes(search.toLowerCase()) ||
        instructor.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((instructor: Instructor) => !specialty || instructor.specialties?.includes(specialty));

  if (sort === 'popular') {
    filteredInstructors.sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
  } else if (sort === 'rating') {
    filteredInstructors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'courses') {
    filteredInstructors.sort((a, b) => (b.coursesCount || 0) - (a.coursesCount || 0));
  }

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / 12));
  const instructors = filteredInstructors.slice((page - 1) * 12, page * 12);
  const specialties = Array.from(new Set(allInstructors.flatMap((i: Instructor) => i.specialties || []))).sort();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter: string, value: string) => {
    if (filter === 'specialty') setSpecialty(value);
    else if (filter === 'sort') setSort(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSpecialty('');
    setSort('popular');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || specialty || sort !== 'popular');

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
            <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>
            <InstructorGridSkeleton count={6} />
          </Container>
        </Section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Our Instructors"
          description="Learn from industry professionals with real-world experience at top companies worldwide."
          canonical="/instructors"
        />
        <ErrorState
          title="Failed to load instructors"
          message="Please try again or check your connection."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO
        title="Our Instructors"
        description="Learn from industry professionals with real-world experience at top companies worldwide."
        canonical="/instructors"
      />
      <StructuredData
        schemas={[
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Instructors', path: '/instructors' },
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
              Our Expert Instructors
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-body-lg text-muted-foreground"
            >
              Learn from industry professionals with real-world experience at top companies worldwide.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* Filter Toolbar & Instructors */}
      <Section size="lg" className="pt-0 sm:pt-0 lg:pt-0">
        <Container>
          <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              {/* Search */}
              <div>
                <label htmlFor="search" className="label-base">
                  Search Instructors
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Search by name or specialty..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Specialty Filter */}
              {specialties.length > 0 && (
                <div>
                  <label htmlFor="specialty" className="label-base">
                    Specialty
                  </label>
                  <Select value={specialty} onValueChange={(value) => handleFilterChange('specialty', value)}>
                    <SelectTrigger id="specialty" className="w-full md:w-44">
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Specialties</SelectItem>
                      {specialties.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sort */}
              <div>
                <label htmlFor="sort" className="label-base">
                  Sort By
                </label>
                <Select value={sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                  <SelectTrigger id="sort" className="w-full md:w-48">
                    <SelectValue placeholder="Most Popular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Students</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="courses">Most Courses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Active filters
                </span>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    "{search}"
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
                {specialty && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpecialty('');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    {specialty}
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
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
              <span className="font-semibold text-foreground">{filteredInstructors.length} instructors</span>
            </p>
          </div>

          <AnimatePresence mode="wait">
            {instructors.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16"
              >
                <EmptyState
                  icon={<Users className="h-12 w-12 text-muted-foreground/50" />}
                  title="No instructors found"
                  description="Try adjusting your search or filters."
                  action={{ label: 'Clear Filters', variant: 'outline', onClick: clearFilters }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {instructors.map((instructor: Instructor, index: number) => (
                  <motion.div
                    key={instructor._id}
                    className="h-full"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.3 } },
                    }}
                  >
                    <InstructorCard instructor={instructor} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
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
        </Container>
      </Section>

      {/* CTA */}
      <Section size="sm" background="gradient">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-heading-md font-semibold">Want to teach on NextEra?</h2>
            <p className="mt-3 text-muted-foreground">
              Join our community of expert instructors and share your knowledge with thousands of learners.
            </p>
            <Button asChild variant="outline" className="mt-4" size="lg">
              <a href="/instructor/apply">Become an Instructor</a>
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}