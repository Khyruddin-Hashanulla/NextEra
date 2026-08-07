import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Users, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from './Reveal';
import { ROUTES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { InstructorCourse } from './types';
import { getCoursePricing } from '@/lib/coursePricing';

interface InstructorCoursesProps {
  courses: InstructorCourse[];
  instructorName: string;
  isLoading?: boolean;
}

function HorizontalCourseCard({ course }: { course: InstructorCourse }) {
  const pricing = getCoursePricing(course);

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg sm:w-[340px]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {course.thumbnail?.url ? (
          <OptimizedImage
            src={course.thumbnail.url}
            alt={course.title}
            placeholderType="course"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            lazy
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <BookOpen className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        {pricing.hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
            {pricing.discountPercent}% OFF
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {course.averageRating ? course.averageRating.toFixed(1) : 'New'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {course.totalEnrollments ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {course.totalDuration ?? 0}h
          </span>
        </div>
        <p className="mt-auto pt-2 text-sm font-bold text-primary">
          {pricing.isFree ? 'Free' : formatCurrency(pricing.price)}
        </p>
      </div>
    </Link>
  );
}

export const InstructorCourses = memo(function InstructorCourses({
  courses,
  instructorName,
  isLoading,
}: InstructorCoursesProps) {
  return (
    <Reveal>
      <div id="courses" className="scroll-mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Recent Courses</h2>
            <p className="mt-1 text-sm text-muted-foreground">Courses taught by {instructorName}</p>
          </div>
          {courses.length > 0 && (
            <Link
              to={ROUTES.COURSES}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-[300px] shrink-0 rounded-2xl sm:w-[340px]" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10 text-muted-foreground/50" />}
            title="No courses published yet"
            description={`${instructorName} hasn't published any courses on NextEra yet.`}
          />
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {courses.map((course) => (
              <HorizontalCourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
});
