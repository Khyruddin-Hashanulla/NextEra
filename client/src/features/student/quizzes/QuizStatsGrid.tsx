import { BarChart3, TrendingUp, Award, XCircle } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { QuizStatCard, type QuizStat } from './QuizStatCard';
import type { QuizStats } from './useQuizHistory';

const stats: QuizStat[] = [
  {
    key: 'totalAttempts',
    label: 'Total Attempts',
    description: 'Quizzes taken so far',
    icon: BarChart3,
    bar: 'bg-primary',
    iconClass: 'bg-primary/15 text-primary',
  },
  {
    key: 'averageScore',
    label: 'Average Score',
    description: 'Mean percentage across attempts',
    icon: TrendingUp,
    bar: 'bg-warning',
    iconClass: 'bg-warning/15 text-warning',
  },
  {
    key: 'passedCount',
    label: 'Passed',
    description: 'Attempts above the passing mark',
    icon: Award,
    bar: 'bg-success',
    iconClass: 'bg-success/15 text-success',
  },
  {
    key: 'failedCount',
    label: 'Failed',
    description: 'Attempts below the passing mark',
    icon: XCircle,
    bar: 'bg-destructive',
    iconClass: 'bg-destructive/15 text-destructive',
  },
];

interface QuizStatsGridProps {
  stats: QuizStats;
}

export function QuizStatsGrid({ stats: quizStats }: QuizStatsGridProps) {
  return (
    <StaggerContainer delay={0.08}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.key}>
            <QuizStatCard stat={stat} value={quizStats[stat.key]} />
          </StaggerItem>
        ))}
      </div>
    </StaggerContainer>
  );
}