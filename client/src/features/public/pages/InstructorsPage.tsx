import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '@/api/endpoints/student';
import { InstructorCard } from '@/components/course/InstructorCard';
import { InstructorGridSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronDown, Users, Star, Award, Code } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import { Section, Container } from '@/components/common/Section';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

interface Instructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  totalCourses?: number;
  totalStudents?: number;
  averageRating?: number;
  totalReviews?: number;
  specialties?: string[];
}

export function InstructorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [sort, setSort] = useState('popular');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-instructors', page, search, specialty, sort],
    queryFn: ({ signal }) => studentApi.listCourses({ limit: 100 }, signal).then(r => {
      const courses = r.data.data.courses || [];
      const instructorMap = new Map();
      courses.forEach((course: any) => {
        if (course.instructor?._id && !instructorMap.has(course.instructor._id)) {
          instructorMap.set(course.instructor._id, {
            _id: course.instructor._id,
            name: course.instructor.name,
            email: course.instructor.email,
            avatar: course.instructor.avatar?.url || '',
            totalCourses: 0,
            totalStudents: 0,
            averageRating: 0,
            totalReviews: 0,
            specialties: [],
          });
        }
        if (course.instructor?._id) {
          const inst = instructorMap.get(course.instructor._id);
          inst.totalCourses++;
          inst.totalStudents += course.totalEnrollments || 0;
          inst.averageRating = (inst.averageRating * (inst.totalCourses - 1) + (course.averageRating || 0)) / inst.totalCourses;
          inst.totalReviews += course.totalReviews || 0;
        }
      });
      let instructors = Array.from(instructorMap.values());
      
      if (search) {
        instructors = instructors.filter(i => 
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.specialties?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      if (specialty) {
        instructors = instructors.filter(i => i.specialties?.includes(specialty));
      }
      
      if (sort === 'popular') {
        instructors.sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
      } else if (sort === 'rating') {
        instructors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      } else if (sort === 'courses') {
        instructors.sort((a, b) => (b.totalCourses || 0) - (a.totalCourses || 0));
      }
      
      const totalPages = Math.ceil(instructors.length / 12);
      const paginated = instructors.slice((page - 1) * 12, page * 12);
      
      return { data: { instructors: paginated, totalPages } };
    }),
    placeholderData: (previousData) => previousData,
  });

  const instructors = data?.data?.instructors || [];
  const totalPages = data?.data?.totalPages || 1;

  const { data: specialtiesData } = useQuery({
    queryKey: ['instructor-specialties'],
    queryFn: ({ signal }) => studentApi.listCourses({ limit: 100 }, signal).then(r => {
      const specialties = new Set<string>();
      r.data.data.courses.forEach((course: any) => {
        course.instructor?.specialties?.forEach((s: string) => specialties.add(s));
      });
      return Array.from(specialties).sort();
    }),
  });

  const specialties = specialtiesData || [];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter: string, value: string) => {
    if (filter === 'specialty') setSpecialty(value);
    else if (filter === 'sort') setSort(value);
    setPage(1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <InstructorGridSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load instructors"
        message="Please try again or check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <SEO title="Our Instructors" description="Learn from industry professionals with real-world experience at top companies worldwide." canonical="/instructors" />
      <StructuredData schemas={[
        breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Instructors', path: '/instructors' },
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

      {/* Filters & Instructors */}
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
                  <label htmlFor="search" className="label-base">Search Instructors</label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      value={search}
                      onChange={handleSearch}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Specialty Filter */}
                {specialties.length > 0 && (
                  <div>
                    <label htmlFor="specialty" className="label-base">Specialty</label>
                    <Select
                      value={specialty}
                      onValueChange={(value) => handleFilterChange('specialty', value)}
                    >
                      <SelectTrigger id="specialty" className="mt-1">
                        <SelectValue placeholder="All Specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Specialties</SelectItem>
                        {specialties.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
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
                      <SelectValue placeholder="Most Popular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Students</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="courses">Most Courses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(search || specialty || sort !== 'popular') && (
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                    setSearch(''); setSpecialty(''); setSort('popular'); setPage(1);
                  }}>
                    <Filter className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </motion.div>
            </aside>

            {/* Instructors Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{instructors.length} instructors</span>
                  {search && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">"{search}"</span>}
                  {specialty && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{specialty}</span>}
                </div>
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
                      action={{ label: 'Clear Filters', href: '/instructors', variant: 'outline' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    {instructors.map((instructor: Instructor, index: number) => (
                      <motion.div key={instructor._id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.3 } } }}>
                        <InstructorCard instructor={instructor} />
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
            <h2 className="text-heading-md font-semibold">Want to teach on NextEra?</h2>
            <p className="mt-3 text-muted-foreground">Join our community of expert instructors and share your knowledge with thousands of learners.</p>
            <Button asChild variant="outline" className="mt-4" size="lg">
              <a href="/instructor/apply">Become an Instructor</a>
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}