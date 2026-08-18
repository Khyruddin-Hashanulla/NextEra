import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { ListOrdered } from 'lucide-react';

interface AttemptDistributionCardProps {
  distribution?: Record<string, number>;
  totalAttempts: number;
}

export function AttemptDistributionCard({ distribution, totalAttempts }: AttemptDistributionCardProps) {
  const entries = Object.entries(distribution ?? {});

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-primary" aria-hidden="true" />
          Attempt Distribution
        </CardTitle>
        <CardDescription>Breakdown of your quiz attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState
            icon={<ListOrdered className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}
            title="No distribution data"
            description="You haven't attempted any quizzes yet"
          />
        ) : (
          <ul className="space-y-4">
            {entries.map(([attemptNumber, count]) => {
              const width = totalAttempts > 0 ? (Number(count) / totalAttempts) * 100 : 0;
              return (
                <li key={attemptNumber}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Attempt #{attemptNumber}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{String(count)}</span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(width)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Attempt ${attemptNumber}: ${count} attempts`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}