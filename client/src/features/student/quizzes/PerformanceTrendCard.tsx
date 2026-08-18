import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { letterGradeFromPercentage, getGradeBadgeVariant } from './useQuizHistory';

interface PerformanceTrendCardProps {
  scoreHistory?: { attemptNumber: number; percentage: number; completedAt?: string }[];
}

export function PerformanceTrendCard({ scoreHistory }: PerformanceTrendCardProps) {
  const history = scoreHistory ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          Performance Trend
        </CardTitle>
        <CardDescription>Your quiz scores over time</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}
            title="No analytics data"
            description="Complete quizzes to see performance analytics"
          />
        ) : (
          <ul className="space-y-3">
            {history.map((point) => {
              const grade = letterGradeFromPercentage(point.percentage);
              return (
                <li
                  key={point.attemptNumber}
                  className="rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Attempt #{point.attemptNumber}</p>
                      {point.completedAt && (
                        <p className="text-xs text-muted-foreground">{formatDate(point.completedAt)}</p>
                      )}
                    </div>
                    <Badge variant={getGradeBadgeVariant(grade)}>{grade}</Badge>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={point.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Attempt ${point.attemptNumber} scored ${point.percentage}%`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(point.percentage, 0), 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {point.percentage}% score
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}