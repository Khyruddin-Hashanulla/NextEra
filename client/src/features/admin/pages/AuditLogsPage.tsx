import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter],
    queryFn: () => adminApi.listAuditLogs({ page, limit: 20, action: actionFilter || undefined }),
   });

  const logs = data?.data?.data?.logs || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'User', accessor: (l: any) => l.user?.name || 'System' },
    { header: 'Action', accessor: (l: any) => (
      <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">{l.action}</span>
    ) },
    { header: 'Resource', accessor: (l: any) => (
      <div><span className="text-sm">{l.resource}</span>{l.resourceId ? <code className="ml-1 rounded bg-muted px-1 text-xs">{l.resourceId.slice(-8)}</code> : null}</div>
    ) },
    { header: 'IP', accessor: (l: any) => l.ip || '-' },
    { header: 'Date', accessor: (l: any) => <span className="text-sm text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <div className="flex gap-2">
        <Input placeholder="Filter by action..." value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="max-w-xs" />
      </div>
      <DataTable columns={columns} data={logs} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
