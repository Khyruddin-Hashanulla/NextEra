import { motion, useReducedMotion } from 'framer-motion';
import { ErrorState } from '@/components/common/ErrorState';
import { categorizeError } from '@/lib/error-utils';
import { useStudentDashboard } from '../dashboard/useStudentDashboard';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { StudentStatsGrid } from '../dashboard/StudentStatsGrid';
import { ContinueLearningSection } from '../dashboard/ContinueLearningSection';
import { LearningOverview } from '../dashboard/LearningOverview';
import { StudentDashboardSkeleton } from '../dashboard/StudentDashboardSkeleton';

const easeOut = [0.22, 1, 0.36, 1] as const;

function getErrorMessage(error: unknown): string {
  switch (categorizeError(error)) {
    case 'network':
      return 'We couldn\u2019t reach our servers. Check your connection and try again.';
    case 'not-found':
      return 'We couldn\u2019t find your dashboard data. Please try again.';
    case 'forbidden':
      return 'You don\u2019t have permission to view this page.';
    case 'server':
      return 'Something went wrong on our end. Please try again.';
    default:
      return 'We encountered an error while loading your dashboard. Please try again.';
  }
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useStudentDashboard();
  const reduceMotion = useReducedMotion();

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your dashboard"
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  }

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
        <DashboardHeader
          inProgress={data?.inProgress ?? 0}
          completedCourses={data?.completedCourses ?? 0}
        />
      </motion.div>

      <motion.div {...fadeUp}>
        <StudentStatsGrid dashboard={data} />
      </motion.div>

      <motion.div {...fadeUp} className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContinueLearningSection recentCourses={data?.recentCourses ?? []} />
        </div>
        <LearningOverview dashboard={data} />
      </motion.div>
    </div>
  );
}