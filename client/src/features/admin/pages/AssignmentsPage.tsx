import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { AdminAssignmentSubmission, AdminAssignmentsAnalytics } from '@/types/admin';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-yellow-50 text-yellow-700',
  late_submission: 'bg-orange-50 text-orange-700',
  under_review: 'bg-purple-50 text-purple-700',
  graded: 'bg-green-50 text-green-700',
  returned_for_resubmission: 'bg-pink-50 text-pink-700',
  rejected: 'bg-red-50 text-red-700',
};

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${className || ''}`}>{value}</p>
    </div>
  );
}

export function AssignmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'assignments', page, search, statusFilter],
    queryFn: ({ signal }) => adminApi.listAssignments({
      page,
      limit: 10,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }, signal),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin', 'assignments', 'analytics'],
    queryFn: ({ signal }) => adminApi.getAssignmentAnalytics({}, signal),
  });

  const submissions = data?.data?.data?.submissions || [];
  const pagination = data?.data?.data?.pagination;
  const analytics: AdminAssignmentsAnalytics = analyticsData?.data?.data || {} as AdminAssignmentsAnalytics;
  const byStatus = analytics.byStatus || {} as AdminAssignmentsAnalytics['byStatus'];

  const columns = [
    { header: 'Student', accessor: (s: AdminAssignmentSubmission) => (
      <div>
        <p className="font-medium">{s.user?.name || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">{s.user?.email}</p>
      </div>
    )},
    { header: 'Course', accessor: (s: AdminAssignmentSubmission) => s.course?.title || '-' },
    { header: 'Assignment', accessor: (s: AdminAssignmentSubmission) => s.lecture?.title || '-' },
    { header: 'Status', accessor: (s: AdminAssignmentSubmission) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] || ''}`}>{s.status.replace(/_/g, ' ')}</span>
    )},
    { header: 'Grade', accessor: (s: AdminAssignmentSubmission) => (
      s.grade !== undefined ? <span className="font-medium">{s.grade}/{s.maxMarks || 100}</span> : <span className="text-muted-foreground">—</span>
    )},
    { header: 'Submitted', accessor: (s: AdminAssignmentSubmission) => new Date(s.submittedAt).toLocaleDateString() },
    { header: 'Actions', accessor: (s: AdminAssignmentSubmission) => (
      <Link to={`/admin/assignments/${s._id}`}>
        <Button variant="outline" size="sm">View</Button>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-sm text-muted-foreground">Monitor all assignment submissions and grading</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={analytics.total || 0} />
        <StatCard label="Submitted" value={byStatus.submitted || 0} className="text-yellow-600" />
        <StatCard label="Late" value={byStatus.lateSubmission || 0} className="text-orange-600" />
        <StatCard label="Under Review" value={byStatus.underReview || 0} className="text-purple-600" />
        <StatCard label="Graded" value={byStatus.graded || 0} className="text-green-600" />
        <StatCard label="Needs Revision" value={byStatus.returnedForResubmission || 0} className="text-pink-600" />
      </div>

      {analytics.gradingStats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Avg Marks" value={analytics.gradingStats.averageGrade || 0} />
          <StatCard label="Avg Percentage" value={analytics.gradingStats.averagePercentage || 0} />
          <StatCard label="Pass Rate" value={analytics.gradingStats.passRate || 0} />
          <StatCard label="Failed" value={analytics.gradingStats.failCount || 0} />
        </div>
      )}

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
        emptyMessage="No submissions found."
      />
    </div>
  );
}
