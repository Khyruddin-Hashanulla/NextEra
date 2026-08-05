import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import { HomeCourseCard } from './HomeCourseCard';
import type { MockCourse } from '@/mocks/types';

interface FeaturedCoursesProps {
  courses: MockCourse[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  viewAllHref?: string;
  className?: string;
}

function FeaturedCoursesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeaturedCourses({
  courses,
  isLoading,
  isError,
  onRetry,
  viewAllHref = ROUTES.COURSES,
  className,
}: FeaturedCoursesProps) {
  return (
    <section id="featured-courses" className={cn('py-16 sm:py-24 lg:py-28', className)}>
      <div className="container-custom">
        <SectionHeading
          eyebrow="Popular courses"
          title="Featured courses to level up"
          subtitle="Hand-picked courses from the catalog — taught by expert instructors and loved by thousands of learners."
        />

        {isLoading ? (
          <FeaturedCoursesSkeleton />
        ) : isError ? (
          <ErrorState
            title="Could not load courses"
            message="We hit a snag fetching the latest courses. Please try again."
            onRetry={onRetry}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="New courses are on the way. Check back soon!"
            icon={<BookOpen className="h-10 w-10" aria-hidden="true" />}
          />
        ) : (
          <>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08 } },
              }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {courses.slice(0, 6).map((course) => (
                <motion.div
                  key={course._id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
                  }}
                >
                  <HomeCourseCard course={course} className="h-full" />
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link to={viewAllHref}>
                  Browse all courses <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
