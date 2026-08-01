import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers/ToastProvider';
import { Search, ClipboardList, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import type { InstructorAssignmentItem, InstructorAssignmentStats } from '@/types/instructor';

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${className || ''}`}>{value}</p>
    </div>
  );
}

export function AssignmentsPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'assignments', page, search],
    queryFn: ({ signal }) => instructorApi.getAssignments({ page, limit: 10, search: search || undefined }, signal),
  });

  const { data: statsData } = useQuery({
    queryKey: ['instructor', 'assignments', 'stats'],
    queryFn: ({ signal }) => instructorApi.getAssignmentStats(signal),
  });

  const assignments = data?.data?.data?.assignments || [];
  const pagination = data?.data?.data?.pagination;
  const stats: InstructorAssignmentStats = statsData?.data?.data || {} as InstructorAssignmentStats;

  const columns = [
    { header: 'Assignment', accessor: (a: InstructorAssignmentItem) => (
      <div>
        <p className="font-medium">{a.title}</p>
        <p className="text-xs text-muted-foreground">{a.course?.title || '-'}</p>
      </div>
    )},
    { header: 'Max Marks', accessor: (a: InstructorAssignmentItem) => a.assignment?.totalMarks ?? 100 },
    { header: 'Due Date', accessor: (a: InstructorAssignmentItem) => a.assignment?.dueDate ? new Date(a.assignment.dueDate).toLocaleDateString() : 'No deadline' },
    { header: 'Submissions', accessor: (a: InstructorAssignmentItem) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{a.submissionCount}</span>
    )},
    { header: 'Actions', accessor: (a: InstructorAssignmentItem) => (
      <Link to={ROUTES.INSTRUCTOR_ASSIGNMENT_SUBMISSIONS(a._id)}>
        <Button variant="outline" size="sm">View Submissions <ExternalLink className="ml-1 h-3 w-3" /></Button>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1"><ClipboardList className="h-4 w-4" /> Manage and grade student submissions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Assignments" value={stats.totalLectures || 0} />
        <StatCard label="Submissions" value={stats.totalSubmissions || 0} />
        <StatCard label="Pending" value={stats.pending || 0} className="text-yellow-600" />
        <StatCard label="Under Review" value={stats.underReview || 0} className="text-purple-600" />
        <StatCard label="Graded" value={stats.graded || 0} className="text-green-600" />
        <StatCard label="Needs Revision" value={stats.returned || 0} className="text-pink-600" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assignments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        emptyMessage="No assignments found. Add assignments to your course lectures to see them here."
      />
    </div>
  );
}
