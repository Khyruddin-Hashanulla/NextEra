import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import type { QuizHistoryOverview, QuizHistoryStats } from '@/types/quiz';

export function useQuizHistory() {
  return useQuery<QuizHistoryOverview>({
    queryKey: ['student', 'quizzes'],
    queryFn: () => studentApi.getQuizzes().then((r) => r.data.data),
  });
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: string;
  passedCount: number;
  failedCount: number;
}

export function getQuizStats(stats?: QuizHistoryStats): QuizStats {
  const totalAttempts = stats?.totalAttempts ?? 0;
  const passedCount = stats?.passedCount ?? 0;
  return {
    totalAttempts,
    passedCount,
    failedCount: Math.max(totalAttempts - passedCount, 0),
    averageScore: Number(stats?.averageScore ?? 0).toFixed(1),
  };
}

export type GradeBadgeVariant = 'success' | 'warning' | 'destructive' | 'default' | 'secondary';

export function letterGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function getGradeBadgeVariant(grade: string): GradeBadgeVariant {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'success';
    case 'B+':
    case 'B':
      return 'default';
    case 'C+':
    case 'C':
    case 'D':
      return 'warning';
    default:
      return 'destructive';
  }
}

export function formatDuration(totalSeconds?: number): string {
  const seconds = Math.max(Math.floor(totalSeconds ?? 0), 0);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export function isAttemptPublished(attempt: { status?: string }): boolean {
  return attempt.status === 'published';
}

const evaluationStatusLabels: Record<string, string> = {
  in_progress: 'In progress',
  auto_graded: 'Auto graded',
  pending: 'Pending review',
  graded: 'Graded',
  published: 'Published',
};

export function getEvaluationStatusLabel(status?: string): string {
  if (!status) return 'Not graded';
  return evaluationStatusLabels[status] ?? status.replace(/_/g, ' ');
}