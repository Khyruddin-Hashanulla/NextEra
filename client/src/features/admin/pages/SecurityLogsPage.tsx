import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const severityColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
};

export function SecurityLogsPage() {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-security-logs', page, severityFilter, eventFilter],
    queryFn: ({ signal }) => adminApi.listSecurityLogs({ page, limit: 20, severity: severityFilter || undefined, event: eventFilter || undefined }, signal),
   });

  const logs = data?.data?.data?.logs || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'User', accessor: (l: any) => l.user?.name || 'Anonymous' },
    { header: 'Event', accessor: (l: any) => <span className="text-sm font-medium">{l.event.replace(/_/g, ' ')}</span> },
    { header: 'Severity', accessor: (l: any) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[l.severity] || ''}`}>{l.severity}</span>
    ) },
    { header: 'IP', accessor: (l: any) => l.ip || '-' },
    { header: 'Date', accessor: (l: any) => <span className="text-sm text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security Logs</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant={severityFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => { setSeverityFilter(''); setPage(1); }}>All</Button>
        <Button variant={severityFilter === 'info' ? 'default' : 'outline'} size="sm" onClick={() => { setSeverityFilter('info'); setPage(1); }}>Info</Button>
        <Button variant={severityFilter === 'warning' ? 'default' : 'outline'} size="sm" onClick={() => { setSeverityFilter('warning'); setPage(1); }}>Warning</Button>
        <Button variant={severityFilter === 'critical' ? 'default' : 'outline'} size="sm" onClick={() => { setSeverityFilter('critical'); setPage(1); }}>Critical</Button>
        <div className="w-px h-6 bg-border mx-1" />
        <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}>
          <option value="">All events</option>
          <option value="login">Login</option>
          <option value="login_failed">Login Failed</option>
          <option value="logout">Logout</option>
          <option value="password_change">Password Change</option>
          <option value="role_change">Role Change</option>
          <option value="suspicious_activity">Suspicious Activity</option>
        </select>
      </div>
      <DataTable columns={columns} data={logs} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />
    </div>
  );
}
