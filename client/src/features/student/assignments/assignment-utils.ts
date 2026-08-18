import type { AssignmentStatus } from '@/types/student';
import type { BadgeProps } from '@/components/ui/badge';

export const ASSIGNMENT_ACCEPT =
  '.pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.webp,.txt,.py,.js,.ts,.java,.c,.cpp,.h,.html,.css,.json,.md';
export const ASSIGNMENT_MAX_SIZE = 25 * 1024 * 1024;
export const ASSIGNMENT_MAX_FILES = 5;
export const ASSIGNMENT_CONTENT_LIMIT = 5000;

const STATUS_LABELS: Partial<Record<AssignmentStatus, string>> = {
  assigned: 'Assigned',
  overdue: 'Overdue',
  submitted: 'Submitted',
  late_submission: 'Late Submission',
  under_review: 'Under Review',
  graded: 'Graded',
  returned_for_resubmission: 'Needs Revision',
  rejected: 'Rejected',
};

const STATUS_VARIANTS: Partial<Record<AssignmentStatus, BadgeProps['variant']>> = {
  assigned: 'secondary',
  overdue: 'destructive',
  submitted: 'warning',
  late_submission: 'warning',
  under_review: 'info',
  graded: 'success',
  returned_for_resubmission: 'warning',
  rejected: 'destructive',
};

export function getAssignmentStatusLabel(status: AssignmentStatus): string | null {
  return STATUS_LABELS[status] ?? null;
}

export function getAssignmentStatusVariant(status: AssignmentStatus): BadgeProps['variant'] | null {
  return STATUS_VARIANTS[status] ?? null;
}

export function isPastDue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const time = new Date(dueDate).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() > time;
}

export function getDaysRemaining(dueDate?: string | null): number | null {
  if (!dueDate) return null;
  const time = new Date(dueDate).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / 86_400_000);
}