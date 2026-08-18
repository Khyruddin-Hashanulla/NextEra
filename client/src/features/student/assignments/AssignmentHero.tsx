import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { Alert, AlertTitle, AlertDescription, AlertIcon } from '@/components/ui/alert';
import { getDaysRemaining, isPastDue } from './assignment-utils';
import type { AssignmentDetailResponse, AssignmentStatus } from '@/types/student';
import { CalendarClock, ShieldAlert } from 'lucide-react';

function formatDueDate(dueDate?: string): string | null {
  if (!dueDate) return null;
  const time = new Date(dueDate).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(dueDate).toLocaleDateString();
}

interface AssignmentHeroProps {
  lecture: AssignmentDetailResponse['lecture'];
  status: AssignmentStatus;
}

export function AssignmentHero({ lecture, status }: AssignmentHeroProps) {
  const assignment = lecture.assignment;
  const dueLabel = formatDueDate(assignment.dueDate);
  const overdue = isPastDue(assignment.dueDate);
  const daysRemaining = getDaysRemaining(assignment.dueDate);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-semibold uppercase tracking-widest text-primary">
            {lecture.course.title}
          </p>
          <h1 className="mt-2 break-words font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {lecture.title}
          </h1>
          {assignment.title && assignment.title !== lecture.title && (
            <p className="mt-1 break-words text-sm text-muted-foreground">{assignment.title}</p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {dueLabel && (
              <span className="inline-flex max-w-full min-w-0 items-center gap-1.5">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  Due {dueLabel}
                  {overdue ? (
                    <span className="font-semibold text-destructive"> · overdue</span>
                  ) : (
                    daysRemaining !== null && (
                      <span className={daysRemaining <= 2 ? 'font-semibold text-warning' : ''}>
                        · {daysRemaining === 0 ? 'due today' : `${daysRemaining} days left`}
                      </span>
                    )
                  )}
                </span>
              </span>
            )}
            {lecture.course.instructor?.name && (
              <span className="inline-flex max-w-full min-w-0 items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{lecture.course.instructor.name}</span>
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0">
          <AssignmentStatusBadge status={status} />
        </div>
      </div>

      {overdue && dueLabel !== null && assignment.allowLateSubmission && (
        <Alert variant="warning">
          <AlertIcon variant="warning" />
          <AlertTitle>Late submissions accepted</AlertTitle>
          <AlertDescription>
            The deadline has passed, but late submissions are still allowed
            {assignment.penaltyPercent ? ` with a ${assignment.penaltyPercent}% penalty` : ''}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}