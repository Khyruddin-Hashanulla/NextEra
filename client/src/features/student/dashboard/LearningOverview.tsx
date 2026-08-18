import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, BookOpen, PlayCircle, GraduationCap, Award, Flame } from 'lucide-react';
import type { StudentDashboard } from '@/types/student';
import { getOverallCompletion } from './useStudentDashboard';

interface LearningOverviewProps {
  dashboard?: StudentDashboard;
}

export function LearningOverview({ dashboard }: LearningOverviewProps) {
  const overallCompletion = getOverallCompletion(dashboard);
  const total = dashboard?.totalCourses ?? 0;
  const inProgress = dashboard?.inProgress ?? 0;
  const completed = dashboard?.completedCourses ?? 0;
  const certificates = dashboard?.certificates ?? 0;

  const miniStats = [
    { label: 'Total Enrolled', value: total, icon: BookOpen, color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'In Progress', value: inProgress, icon: PlayCircle, color: 'text-warning' },
    { label: 'Completed', value: completed, icon: GraduationCap, color: 'text-success' },
    { label: 'Certificates', value: certificates, icon: Award, color: 'text-primary' },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">Learning Overview</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-end justify-between gap-2">
            <p className="text-sm text-muted-foreground">Overall completion</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{overallCompletion}%</p>
          </div>
          <Progress value={overallCompletion} className="mt-3" aria-label="Overall course completion" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completed} of {total} course{total === 1 ? '' : 's'} completed
          </p>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-2 gap-3">
          {miniStats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                <span className="text-xl font-bold tabular-nums tracking-tight">{value}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
          {inProgress > 0 ? 'Keep learning to reach your goals!' : 'Ready when you are — pick a course to start.'}
        </div>
      </CardContent>
    </Card>
  );
}