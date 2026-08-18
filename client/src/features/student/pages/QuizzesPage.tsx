import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { FileQuestion, History, BarChart3 } from 'lucide-react';
import { quizApi } from '@/api/endpoints/quiz';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { useToast } from '@/providers/ToastProvider';
import { categorizeError } from '@/lib/error-utils';
import { useQuizHistory, getQuizStats } from '../quizzes/useQuizHistory';
import { QuizHistoryHeader } from '../quizzes/QuizHistoryHeader';
import { QuizStatsGrid } from '../quizzes/QuizStatsGrid';
import { QuizAttemptCard } from '../quizzes/QuizAttemptCard';
import { QuizHistorySkeleton } from '../quizzes/QuizHistorySkeleton';
import { PerformanceTrendCard } from '../quizzes/PerformanceTrendCard';
import { AttemptDistributionCard } from '../quizzes/AttemptDistributionCard';
import { QuizAttemptResultDialog } from '../quizzes/QuizAttemptResultDialog';
import type { QuizHistoryAttempt, QuizAttemptResult } from '@/types/quiz';

const easeOut = [0.22, 1, 0.36, 1] as const;

export function QuizzesPage() {
  const { addToast } = useToast();
  const { data, isLoading, isError, error, refetch } = useQuizHistory();
  const reduceMotion = useReducedMotion();

  const [selectedAttempt, setSelectedAttempt] = useState<QuizHistoryAttempt | null>(null);
  const [isViewResultOpen, setIsViewResultOpen] = useState(false);

  const viewResultMutation = useMutation({
    mutationFn: (attemptId: string) => quizApi.getAttemptResult(attemptId).then((r) => r.data.data as QuizAttemptResult),
    onSuccess: () => {
      setIsViewResultOpen(true);
    },
    onError: () => {
      addToast({ title: 'Error', description: 'Failed to load attempt result', variant: 'error' });
    },
  });

  const downloadResultMutation = useMutation({
    mutationFn: (attemptId: string) => quizApi.downloadResult(attemptId).then((r) => r.data),
    onSuccess: () => {
      addToast({ title: 'Success', description: 'Result downloaded successfully', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Error', description: 'Failed to download result', variant: 'error' });
    },
  });

  if (isLoading) {
    return <QuizHistorySkeleton />;
  }

  if (isError) {
    const category = categorizeError(error);
    return category === 'network' ? (
      <ErrorState
        title="Connection Error"
        message="Unable to connect to the server. Please check your internet connection and try again."
        onRetry={() => refetch()}
      />
    ) : (
      <ErrorState
        title="Unable to load quiz data"
        message="We couldn't load your quiz history. Please try again later."
        onRetry={() => refetch()}
      />
    );
  }

  const quizzes = data?.quizzes ?? [];
  const stats = getQuizStats(data?.stats);

  const handleViewResult = (attempt: QuizHistoryAttempt) => {
    setSelectedAttempt(attempt);
    viewResultMutation.mutate(attempt._id);
  };

  const handleDownload = (attempt: QuizHistoryAttempt) => {
    downloadResultMutation.mutate(attempt._id);
  };

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
        <QuizHistoryHeader />
      </motion.div>

      <QuizStatsGrid stats={stats} />

      {quizzes.length === 0 ? (
        <motion.div {...fadeUp}>
          <EmptyState
            icon={<FileQuestion className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}
            title="No quiz attempts yet"
            description="Attempt quizzes from the course player to see your results here"
            action={{ label: 'Go to My Courses', href: '/student/my-courses' }}
          />
        </motion.div>
      ) : (
        <Tabs defaultValue="attempts" className="w-full">
          <TabsList>
            <TabsTrigger value="attempts" className="gap-2">
              <History className="h-4 w-4" aria-hidden="true" />
              Recent Attempts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attempts" className="mt-6 space-y-4">
            <StaggerContainer>
              <div className="space-y-4">
                {quizzes.map((attempt) => (
                  <StaggerItem key={attempt._id}>
                    <QuizAttemptCard
                      attempt={attempt}
                      isDownloading={downloadResultMutation.isPending}
                      isViewing={viewResultMutation.isPending}
                      onViewResult={handleViewResult}
                      onDownload={handleDownload}
                    />
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <StaggerContainer delay={0.05}>
              <div className="grid gap-6 lg:grid-cols-2">
                <StaggerItem>
                  <PerformanceTrendCard scoreHistory={data?.stats?.scoreHistory} />
                </StaggerItem>
                <StaggerItem>
                  <AttemptDistributionCard
                    distribution={data?.stats?.attemptDistribution}
                    totalAttempts={stats.totalAttempts}
                  />
                </StaggerItem>
              </div>
            </StaggerContainer>
          </TabsContent>
        </Tabs>
      )}

      <QuizAttemptResultDialog
        attempt={selectedAttempt}
        open={isViewResultOpen}
        onOpenChange={setIsViewResultOpen}
        result={viewResultMutation.data}
      />
    </div>
  );
}