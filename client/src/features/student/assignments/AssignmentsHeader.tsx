import { ClipboardList } from 'lucide-react';

interface AssignmentsHeaderProps {
  total?: number;
}

export function AssignmentsHeader({ total }: AssignmentsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Student</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Assignments</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Track, complete, and submit your assignment work on time.
        </p>
      </div>

      {typeof total === 'number' && (
        <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm">
          <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-bold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">assignments</span>
        </div>
      )}
    </div>
  );
}