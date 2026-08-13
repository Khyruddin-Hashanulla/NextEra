import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/features/admin/components/DataTable';
import type { Column } from '@/features/admin/components/DataTable';
import { useToast } from '@/providers/ToastProvider';
import type { LiveClassRecording } from '@/types/liveClass';
import { Video, Trash2, Search, ExternalLink } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  available: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  deleted: 'bg-gray-100 text-gray-500',
};

function formatStatus(status: string): string {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = (seconds || 0) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export function RecordingManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'recordings', page, search, status],
    queryFn: ({ signal }) =>
      adminApi.listRecordings(
        {
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
        },
        signal
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRecording(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recordings'] });
      addToast({ title: 'Recording deleted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Delete failed', variant: 'error' }),
  });

  const recordings = data?.data?.data?.recordings || [];
  const pagination = data?.data?.data?.pagination;

  const columns: Column<LiveClassRecording>[] = [
    {
      header: 'Recording',
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate font-medium">{r.title}</p>
            {r.meetingId && <p className="text-xs text-muted-foreground">Meeting: {r.meetingId}</p>}
          </div>
        </div>
      ),
    },
    { header: 'Course', accessor: (r) => r.course?.title || '-', className: 'hidden lg:table-cell' },
    { header: 'Instructor', accessor: (r) => r.instructor?.name || '-', className: 'hidden lg:table-cell' },
    { header: 'Duration', accessor: (r) => formatDuration(r.duration) },
    { header: 'Size', accessor: (r) => formatSize(r.fileSize), className: 'hidden md:table-cell' },
    {
      header: 'Status',
      accessor: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] || ''}`}>
          {formatStatus(r.status)}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (r) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (r) => (
        <div className="flex justify-end gap-1">
          {r.url && (
            <Button variant="ghost" size="sm" asChild title="Open recording">
              <a href={r.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            title="Delete recording"
            onClick={() => deleteMutation.mutate(r._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recordings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage live class recordings synced from Zoom across all courses
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput.trim());
                setPage(1);
              }
            }}
            placeholder="Search title, topic, meeting ID..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-lg border p-8 text-center text-sm text-destructive">
          Failed to load recordings. Please try again.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={recordings}
          isLoading={isLoading}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          emptyMessage="No recordings found."
        />
      )}
    </div>
  );
}
