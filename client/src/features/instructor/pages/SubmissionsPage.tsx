import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import type { InstructorSubmissionItem } from '@/types/instructor';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-yellow-50 text-yellow-700' },
  late_submission: { label: 'Late', className: 'bg-orange-50 text-orange-700' },
  under_review: { label: 'Under Review', className: 'bg-purple-50 text-purple-700' },
  graded: { label: 'Graded', className: 'bg-green-50 text-green-700' },
  returned_for_resubmission: { label: 'Needs Revision', className: 'bg-pink-50 text-pink-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700' },
};

export function SubmissionsPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'assignments', lectureId, 'submissions', page, search, statusFilter],
    queryFn: ({ signal }) => instructorApi.getLectureSubmissions(lectureId!, {
      page,
      limit: 10,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }, signal),
    enabled: !!lectureId,
  });

  const result = data?.data?.data;
  const submissions = result?.submissions || [];
  const pagination = result?.pagination;
  const lecture = result?.lecture;

  const columns = [
    { header: 'Student', accessor: (s: InstructorSubmissionItem) => (
      <div>
        <p className="font-medium">{s.user?.name || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">{s.user?.email}</p>
      </div>
    )},
    { header: 'Status', accessor: (s: InstructorSubmissionItem) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]?.className || ''}`}>
        {STATUS_STYLES[s.status]?.label || s.status}
      </span>
    )},
    { header: 'Grade', accessor: (s: InstructorSubmissionItem) => (
      s.grade !== undefined ? <span className="font-medium">{s.grade}/{s.maxMarks || 100}</span> : <span className="text-muted-foreground">—</span>
    )},
    { header: 'Submitted', accessor: (s: InstructorSubmissionItem) => new Date(s.submittedAt).toLocaleDateString() },
    { header: 'Version', accessor: (s: InstructorSubmissionItem) => s.submissionVersion },
    { header: 'Actions', accessor: (s: InstructorSubmissionItem) => (
      <Link to={ROUTES.INSTRUCTOR_ASSIGNMENT_SUBMISSION_DETAIL(s._id)}>
        <Button variant="outline" size="sm">Review</Button>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link to={ROUTES.INSTRUCTOR_ASSIGNMENTS} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Assignments
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{lecture?.title || 'Assignment'}</h1>
        <p className="text-sm text-muted-foreground">Submissions</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="late_submission">Late Submission</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="returned_for_resubmission">Needs Revision</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        emptyMessage="No submissions for this assignment yet."
      />
    </div>
  );
}
