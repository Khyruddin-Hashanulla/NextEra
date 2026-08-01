import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGridSkeleton } from '@/components/skeletons/ListSkeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import type { AssignmentOverviewItem, AssignmentStatus } from '@/types/student';
import { ClipboardList, ChevronRight } from 'lucide-react';

const STATUS_STYLES: Record<AssignmentStatus, { label: string; className: string }> = {
  assigned: { label: 'Assigned', className: 'bg-blue-50 text-blue-700' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700' },
  submitted: { label: 'Submitted', className: 'bg-yellow-50 text-yellow-700' },
  late_submission: { label: 'Late Submission', className: 'bg-orange-50 text-orange-700' },
  under_review: { label: 'Under Review', className: 'bg-purple-50 text-purple-700' },
  graded: { label: 'Graded', className: 'bg-green-50 text-green-700' },
  returned_for_resubmission: { label: 'Needs Revision', className: 'bg-pink-50 text-pink-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700' },
};

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const s = STATUS_STYLES[status];
  return <Badge className={s.className}>{s.label}</Badge>;
}

function AssignmentCard({ item }: { item: AssignmentOverviewItem }) {
  const sub = item.submission;
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">{item.title}</CardTitle>
          <StatusBadge status={item.status} />
        </div>
        <p className="text-xs text-muted-foreground">{item.course?.title || 'Course'}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Max Marks: {item.maxMarks}</span>
          {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
        </div>
        {sub && (
          <div className="space-y-1 rounded-lg bg-muted/40 p-2">
            {sub.letterGrade && (
              <p className="text-sm font-semibold">
                {sub.letterGrade}
                {sub.percentage !== undefined && ` · ${sub.percentage}%`}
                {sub.grade !== undefined && ` · ${sub.grade}/${sub.maxMarks || item.maxMarks}`}
              </p>
            )}
            {sub.passFail && (
              <p className={`text-xs font-medium ${sub.passFail === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                {sub.passFail === 'pass' ? 'Passed' : 'Failed'}
              </p>
            )}
            {sub.lateSubmission && <p className="text-xs text-orange-600">Late submission</p>}
          </div>
        )}
        <Link to={ROUTES.STUDENT_ASSIGNMENT_DETAIL(item._id)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View Details <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function AssignmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading } = useQuery({
    queryKey: ['student', 'assignments', 'overview', page, statusFilter],
    queryFn: ({ signal }) =>
      studentApi.getAssignmentsOverview({
        page,
        limit: 12,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }, signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return <CardGridSkeleton />;
  }

  const items = data?.assignments || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">Track and submit your assignments</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'assigned', 'submitted', 'under_review', 'graded', 'returned_for_resubmission', 'rejected', 'overdue'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {STATUS_STYLES[s as AssignmentStatus].label}
          </button>
        ))}
      </div>

      {!items.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="mx-auto mb-2 h-8 w-8" />
            No assignments found.
            <div className="mt-2">
              <Link to="/student/my-courses" className="text-sm text-primary hover:underline">Go to My Courses</Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <AssignmentCard key={item._id} item={item} />)}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pages}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
