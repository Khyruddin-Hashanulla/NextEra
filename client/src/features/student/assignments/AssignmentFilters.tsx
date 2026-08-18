import { getAssignmentStatusLabel } from './assignment-utils';
import type { AssignmentStatus } from '@/types/student';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  'assigned',
  'submitted',
  'under_review',
  'graded',
  'returned_for_resubmission',
  'rejected',
  'overdue',
] as AssignmentStatus[];

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  ...STATUS_FILTERS.flatMap((s) => {
    const label = getAssignmentStatusLabel(s);
    return label ? [{ value: s, label }] : [];
  }),
];

interface AssignmentFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

export function AssignmentFilters({ value, onChange }: AssignmentFiltersProps) {
  return (
    <div role="group" aria-label="Filter assignments by status" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const active = value === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            aria-label={filter.label}
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}