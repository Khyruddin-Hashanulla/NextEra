import { Award, PlayCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseStatus } from './useMyCourses';

interface CourseStatusBadgeProps {
  status: CourseStatus;
}

const styles: Record<CourseStatus, { className: string; label: string; icon: typeof PlayCircle }> = {
  'in-progress': {
    className: 'bg-primary/15 text-primary ring-primary/30',
    label: 'In Progress',
    icon: PlayCircle,
  },
  completed: {
    className: 'bg-success/15 text-success ring-success/30',
    label: 'Completed',
    icon: Award,
  },
  'not-started': {
    className: 'bg-muted text-muted-foreground ring-border',
    label: 'Not Started',
    icon: BookOpen,
  },
};

export function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  const { className, label, icon: Icon } = styles[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ring-1',
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}