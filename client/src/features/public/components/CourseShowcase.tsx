import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseGridSkeleton } from '@/components/common/LoadingSkeleton';

import type { MockCourse } from '@/mocks/types';

interface CourseShowcaseProps {
  courses: MockCourse[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  limit?: number;
  isLoading?: boolean;
  className?: string;
}

export function CourseShowcase({
  courses,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View All',
  limit,
  isLoading,
  className,
}: CourseShowcaseProps) {
  const displayCourses = limit ? courses.slice(0, limit) : courses;

  return (
    <div className={cn('space-y-8', className)}>
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>}
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline whitespace-nowrap"
            >
              {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {isLoading ? (
        <CourseGridSkeleton count={limit || 3} />
      ) : displayCourses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground/70">
          <p>No courses available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
