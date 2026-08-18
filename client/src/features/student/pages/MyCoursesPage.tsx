import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { categorizeError } from '@/lib/error-utils';
import { BookOpen, PlayCircle } from 'lucide-react';
import {
  useMyCourses,
  filterCourses,
  getCourseStats,
  getContinueCourse,
  type CourseFilter,
} from '../my-courses/useMyCourses';
import { MyLearningHeader } from '../my-courses/MyLearningHeader';
import { ContinueLearningSection } from '../my-courses/ContinueLearningSection';
import { LearningTabs } from '../my-courses/LearningTabs';
import { CourseCard } from '../my-courses/CourseCard';
import { ExploreCoursesCard } from '../my-courses/ExploreCoursesCard';
import { MyLearningSkeleton } from '../my-courses/MyLearningSkeleton';

const easeOut = [0.22, 1, 0.36, 1] as const;

function getErrorMessage(error: unknown): string {
  switch (categorizeError(error)) {
    case 'network':
      return 'We couldn\u2019t reach our servers. Check your connection and try again.';
    case 'forbidden':
      return 'You don\u2019t have permission to view this page.';
    case 'server':
      return 'Something went wrong on our end. Please try again.';
    default:
      return 'We encountered an error while loading your courses. Please try again.';
  }
}

export function MyCoursesPage() {
  const [filter, setFilter] = useState<CourseFilter>('all');
  const { data, isLoading, isError, error, refetch } = useMyCourses();
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return <MyLearningSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your courses"
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  }

  const stats = getCourseStats(data);
  const filtered = filterCourses(data, filter);
  const continueCourse = getContinueCourse(data);

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: easeOut },
      };

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp}>
        <MyLearningHeader stats={stats} />
      </motion.div>

      {continueCourse && (
        <motion.div {...fadeUp}>
          <ContinueLearningSection enrollment={continueCourse} />
        </motion.div>
      )}

      <motion.div {...fadeUp}>
        <LearningTabs active={filter} counts={stats} onChange={setFilter} />
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div {...fadeUp}>
          <EmptyState
            icon={
              filter === 'all' ? (
                <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              ) : (
                <PlayCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              )
            }
            title={
              filter === 'completed'
                ? 'No completed courses yet'
                : filter === 'in-progress'
                  ? 'No courses in progress'
                  : 'Your learning journey starts here'
            }
            description={
              filter === 'all'
                ? 'You are not enrolled in any courses yet — browse the catalog and begin learning.'
                : filter === 'completed'
                  ? 'Finish a course to earn a certificate and see it here.'
                  : 'Start a course to begin tracking your progress here.'
            }
            action={filter === 'all' ? { label: 'Browse Courses', href: '/courses' } : undefined}
          />
        </motion.div>
      ) : (
        <StaggerContainer>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((enrollment) => (
              <StaggerItem key={enrollment._id}>
                <CourseCard enrollment={enrollment} />
              </StaggerItem>
            ))}
            <StaggerItem>
              <ExploreCoursesCard />
            </StaggerItem>
          </div>
        </StaggerContainer>
      )}
    </div>
  );
}