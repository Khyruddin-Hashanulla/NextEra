import { ArrowLeft, GraduationCap, ListVideo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LearningHeaderProps {
  courseTitle: string;
  completionPercent: number;
  onOpenCurriculum: () => void;
  className?: string;
}

export function LearningHeader({ courseTitle, completionPercent, onOpenCurriculum, className }: LearningHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-16 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:gap-3 sm:px-5 lg:top-0',
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
        <GraduationCap className="h-5 w-5" />
      </div>

      <Link
        to="/student/my-courses"
        className="flex min-w-0 items-center gap-1.5 rounded-lg pr-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">My Courses</span>
      </Link>

      <div className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{courseTitle}</p>
        <div className="hidden items-center gap-2 pt-0.5 sm:flex">
          <div
            className="h-1 w-24 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercent}
          >
            <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${completionPercent}%` }} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{completionPercent}%</span>
        </div>
      </div>

      <Button variant="ghost" size="iconSm" onClick={onOpenCurriculum} className="xl:hidden" aria-label="Open curriculum" aria-haspopup="dialog">
        <ListVideo className="h-5 w-5" />
      </Button>
    </header>
  );
}