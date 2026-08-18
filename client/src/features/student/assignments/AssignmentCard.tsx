import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ROUTES } from '@/lib/constants';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { isPastDue, getDaysRemaining } from './assignment-utils';
import type { AssignmentOverviewItem } from '@/types/student';
import { ArrowRight, CalendarClock, FileText, Trophy } from 'lucide-react';

function formatDueDate(dueDate?: string): string | null {
  if (!dueDate) return null;
  const time = new Date(dueDate).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(dueDate).toLocaleDateString();
}

export function AssignmentCard({ item }: { item: AssignmentOverviewItem }) {
  const sub = item.submission;
  const dueLabel = formatDueDate(item.dueDate);
  const daysRemaining = getDaysRemaining(item.dueDate);
  const overdue = isPastDue(item.dueDate);
  const showGrade =
    sub && (sub.letterGrade || sub.percentage !== undefined || sub.passFail || sub.grade !== undefined);

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-28 overflow-hidden">
        {item.course?.thumbnail?.url ? (
          <OptimizedImage
            src={item.course.thumbnail.url}
            alt=""
            placeholderType="course"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            lazy
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
            <FileText className="h-10 w-10 text-primary/40" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="min-w-0 truncate rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {item.course?.title || 'Course'}
          </span>
          <AssignmentStatusBadge status={item.status} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <Link
          to={ROUTES.STUDENT_ASSIGNMENT_DETAIL(item._id)}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {item.title}
        </Link>

        {showGrade && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/50 px-3 py-2">
            {sub!.letterGrade && (
              <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {sub!.letterGrade}
              </span>
            )}
            {sub!.percentage !== undefined && (
              <span className="text-xs font-medium text-muted-foreground">{sub!.percentage}%</span>
            )}
            {sub!.passFail && (
              <span
                className={`text-xs font-semibold ${sub!.passFail === 'pass' ? 'text-success' : 'text-destructive'}`}
              >
                {sub!.passFail === 'pass' ? 'Passed' : 'Failed'}
              </span>
            )}
            {sub!.lateSubmission && <span className="text-xs font-medium text-warning">Late submission</span>}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {dueLabel ? (
              <>
                Due {dueLabel}
                {!overdue && daysRemaining !== null && (
                  <span className={daysRemaining <= 2 ? 'font-semibold text-warning' : ''}>
                    · {daysRemaining === 0 ? 'today' : `${daysRemaining}d left`}
                  </span>
                )}
              </>
            ) : (
              'No deadline'
            )}
          </span>
          <span className="font-medium">Max {item.maxMarks} marks</span>
        </div>

        <Link
          to={ROUTES.STUDENT_ASSIGNMENT_DETAIL(item._id)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {sub ? 'View Submission' : 'View Assignment'}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}