import { Badge } from '@/components/ui/badge';
import { getAssignmentStatusLabel, getAssignmentStatusVariant } from './assignment-utils';
import type { AssignmentStatus } from '@/types/student';

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const label = getAssignmentStatusLabel(status);
  const variant = getAssignmentStatusVariant(status);
  if (!label || !variant) return null;
  return <Badge variant={variant}>{label}</Badge>;
}