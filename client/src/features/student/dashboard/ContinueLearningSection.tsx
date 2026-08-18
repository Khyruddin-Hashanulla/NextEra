import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import type { StudentDashboardEnrollment } from '@/types/student';
import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/lib/constants';
import { ContinueLearningCard } from './ContinueLearningCard';

interface ContinueLearningSectionProps {
  recentCourses?: StudentDashboardEnrollment[];
}

export function ContinueLearningSection({ recentCourses = [] }: ContinueLearningSectionProps) {
  const courses = recentCourses.slice(0, 3);

  return (
    <section aria-labelledby="continue-learning-title">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="continue-learning-title" className="font-display text-lg font-bold tracking-tight">
          Continue Learning
        </h2>
        {courses.length > 0 && (
          <Link
            to={ROUTES.STUDENT_COURSES}
            className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}
          title="No courses in progress"
          description="Browse the course catalog and start a new learning journey."
          action={{ label: 'Browse Courses', href: ROUTES.COURSES }}
          className="rounded-xl border bg-card py-12"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((enrollment) => (
            <ContinueLearningCard key={enrollment._id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </section>
  );
}