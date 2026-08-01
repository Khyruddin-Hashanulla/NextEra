import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/features/admin/components/DataTable';
import type { Column } from '@/features/admin/components/DataTable';
import type { GradingLogEntry } from '@/types/admin';
import { Download, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  graded: 'bg-green-50 text-green-700',
  returned_for_resubmission: 'bg-pink-50 text-pink-700',
  rejected: 'bg-red-50 text-red-700',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toCSV(logs: GradingLogEntry[]): string {
  const headers = ['Timestamp', 'Student', 'Email', 'Course', 'Assignment', 'Grade', 'Max Marks', 'Percentage', 'Letter Grade', 'Pass/Fail', 'Status', 'Graded By'];
  const rows = logs.map((l) => [
    l.gradedAt, l.user?.name || '', l.user?.email || '', l.course?.title || '',
    l.lecture?.title || '', l.grade ?? '', l.maxMarks ?? '', l.percentage ?? '',
    l.letterGrade || '', l.passFail || '', l.status, l.gradedBy?.name || '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function GradingLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'assignments', 'grading-log', page],
    queryFn: ({ signal }) => adminApi.getGradingLogs({ page, limit: 20 }, signal),
  });

  const logs = data?.data?.data?.logs || [];
  const pagination = data?.data?.data?.pagination;

  const columns: Column<GradingLogEntry>[] = [
    {
      header: 'Student',
      accessor: (l) => (
        <div>
          <p className="font-medium">{l.user?.name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{l.user?.email}</p>
        </div>
      ),
    },
    { header: 'Course', accessor: (l) => l.course?.title || '-', className: 'hidden lg:table-cell' },
    { header: 'Assignment', accessor: (l) => l.lecture?.title || '-' },
    {
      header: 'Grade',
      accessor: (l) => (
        <span className="font-medium">
          {l.letterGrade || `${l.grade ?? '-'}/${l.maxMarks ?? 100}`}
          {l.percentage !== undefined && <span className="ml-1 text-xs text-muted-foreground">({l.percentage}%)</span>}
        </span>
      ),
    },
    {
      header: 'Result',
      accessor: (l) => (
        l.passFail ? (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${l.passFail === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
            {l.passFail === 'pass' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {l.passFail === 'pass' ? 'Pass' : 'Fail'}
          </span>
        ) : <span className="text-muted-foreground">—</span>
      ),
    },
    {
      header: 'Status',
      accessor: (l) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[l.status] || ''}`}>
          {formatStatus(l.status)}
        </span>
      ),
    },
    { header: 'Graded By', accessor: (l) => l.gradedBy?.name || 'Instructor', className: 'hidden md:table-cell' },
    {
      header: 'Date',
      accessor: (l) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{new Date(l.gradedAt).toLocaleString()}</span>
      ),
    },
  ];

  const handleExportCSV = () => {
    downloadCSV(toCSV(logs), `grading-logs-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grading Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit trail of every grade published, returned, or rejected across all assignments
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={logs.length === 0}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border p-8 text-center text-sm text-destructive">
          Failed to load grading logs. Please try again.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          emptyMessage="No grading activity yet."
        />
      )}
    </div>
  );
}
