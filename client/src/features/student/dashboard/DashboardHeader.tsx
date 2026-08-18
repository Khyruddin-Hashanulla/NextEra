import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { GraduationCap, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  inProgress: number;
  completedCourses: number;
}

export function DashboardHeader({ inProgress, completedCourses }: DashboardHeaderProps) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || '';

  const subtitle =
    inProgress > 0
      ? `You have ${inProgress} course${inProgress === 1 ? '' : 's'} in progress — keep the momentum going.`
      : completedCourses > 0
        ? 'You have completed courses ready to revisit. Keep exploring new skills.'
        : 'Track your learning journey and reach your goals.';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-widest">Your learning space</p>
        </div>
        <h1 className="mt-2 truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>

      <Button asChild size="lg" className="shrink-0">
        <Link to={ROUTES.COURSES}>
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          Explore Courses
        </Link>
      </Button>
    </div>
  );
}