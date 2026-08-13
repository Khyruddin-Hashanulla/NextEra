import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstructorCard } from './InstructorCard';
import { InstructorGridSkeleton } from '@/components/common/LoadingSkeleton';

interface Instructor {
  _id: string;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  studentsCount?: number;
  coursesCount?: number;
}

interface InstructorShowcaseProps {
  instructors: Instructor[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  limit?: number;
  isLoading?: boolean;
  className?: string;
}

export function InstructorShowcase({
  instructors,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View All',
  limit,
  isLoading,
  className,
}: InstructorShowcaseProps) {
  const displayInstructors = limit ? instructors.slice(0, limit) : instructors;

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
        <InstructorGridSkeleton count={limit || 4} />
      ) : displayInstructors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground/70">
          <p>No instructors available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {displayInstructors.map((instructor) => (
            <InstructorCard key={instructor._id} instructor={instructor} />
          ))}
        </div>
      )}
    </div>
  );
}
