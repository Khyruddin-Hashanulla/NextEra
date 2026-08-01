import { ApiError } from './ApiError';

export const ASSIGNMENT_STATUSES = [
  'assigned',
  'submitted',
  'late_submission',
  'under_review',
  'graded',
  'returned_for_resubmission',
  'rejected',
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

/**
 * Statuses on which an instructor/admin may apply grading data.
 * 'assigned' has no submission document, 'returned_for_resubmission' resets
 * grading when the student resubmits.
 */
export const GRADEABLE_STATUSES: ReadonlySet<AssignmentStatus> = new Set([
  'submitted',
  'late_submission',
  'under_review',
  'graded',
  'returned_for_resubmission',
]);

export function isAssignmentStatus(value: unknown): value is AssignmentStatus {
  return typeof value === 'string' && (ASSIGNMENT_STATUSES as readonly string[]).includes(value);
}

export function computePercentage(grade: number, maxMarks: number): number {
  if (!Number.isFinite(maxMarks) || maxMarks <= 0) return 0;
  return Math.round((grade / maxMarks) * 10000) / 100;
}

export function computePassFail(
  grade: number,
  passingMarks: number | undefined,
  maxMarks: number
): 'pass' | 'fail' {
  if (passingMarks === undefined || passingMarks <= 0) {
    const threshold = maxMarks * 0.6;
    return grade >= threshold ? 'pass' : 'fail';
  }
  return grade >= passingMarks ? 'pass' : 'fail';
}

export function computeLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
}

export function assertValidGrade(grade: number, maxMarks: number): void {
  if (typeof grade !== 'number' || !Number.isFinite(grade) || grade < 0) {
    throw ApiError.badRequest('Obtained marks must be a non-negative number');
  }
  if (typeof maxMarks !== 'number' || !Number.isFinite(maxMarks) || maxMarks <= 0) {
    throw ApiError.badRequest('Maximum marks must be a positive number');
  }
  if (grade > maxMarks) {
    throw ApiError.badRequest('Obtained marks cannot exceed maximum marks');
  }
}

export function getDefaultMaxMarks(lecture: { assignment?: { totalMarks?: number } } | null, fallback = 100): number {
  const total = lecture?.assignment?.totalMarks;
  return typeof total === 'number' && total > 0 ? total : fallback;
}
