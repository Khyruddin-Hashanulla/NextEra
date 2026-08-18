import { BookOpen, PlayCircle, GraduationCap } from 'lucide-react';

interface MyLearningHeaderProps {
  stats: { total: number; inProgress: number; completed: number };
}

const metrics = [
  { key: 'total', label: 'Enrolled', icon: BookOpen, color: 'text-cyan-600 dark:text-cyan-400' },
  { key: 'inProgress', label: 'In Progress', icon: PlayCircle, color: 'text-warning' },
  { key: 'completed', label: 'Completed', icon: GraduationCap, color: 'text-success' },
] as const;

export function MyLearningHeader({ stats }: MyLearningHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">My Learning</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">My Learning</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Continue your progress, track your courses, and keep learning at your own pace.
        </p>
      </div>

      <div className="flex items-center gap-4" aria-label="Learning statistics">
        {metrics.map(({ key, label, icon: Icon, color }, index) => (
          <div key={key} className="flex items-center gap-4">
            {index > 0 && <span className="h-8 w-px bg-border" aria-hidden="true" />}
            <div className="flex items-center gap-2.5">
              <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
              <div>
                <p className="text-xl font-bold leading-none tabular-nums tracking-tight">{stats[key]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}