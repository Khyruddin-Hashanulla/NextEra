import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/features/admin/components/DataTable';
import type { Column } from '@/features/admin/components/DataTable';
import type { AuditLogItem } from '@/types/admin';
import {
  Search, Download, FileJson, X, Filter, ArrowUpDown, ShieldAlert,
} from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

function actionColor(action: string): string {
  if (action.includes('DELETE') || action.includes('REJECT') || action.includes('REVOKE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('GENERATE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('MODERATE')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toCSV(logs: AuditLogItem[]): string {
  const headers = ['Timestamp', 'Admin', 'Email', 'Action', 'Resource Type', 'Resource ID', 'Resource Name', 'Success', 'Status Code', 'Method', 'URL', 'IP', 'Browser', 'OS', 'Device', 'Error'];
  const rows = logs.map((l) => [
    l.timestamp, l.adminName, l.adminEmail, l.action, l.resourceType,
    l.resourceId || '', l.resourceName || '', l.success ? 'Yes' : 'No',
    l.statusCode || '', l.requestMethod || '', l.requestUrl || '',
    l.ipAddress || '', l.browser || '', l.operatingSystem || '', l.deviceType || '',
    l.errorMessage || '',
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

function DetailModal({ log, open, onClose }: { log: AuditLogItem | null; open: boolean; onClose: () => void }) {
  if (!log) return null;
  const sections: { label: string; data: Record<string, any> | undefined }[] = [
    { label: 'Previous Data', data: log.previousData },
    { label: 'New Data', data: log.newData },
    { label: 'Metadata', data: log.metadata },
  ];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Audit Log Detail — {formatAction(log.action)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Admin', log.adminName],
              ['Email', log.adminEmail],
              ['Action', formatAction(log.action)],
              ['Resource', `${log.resourceType}${log.resourceName ? ` — ${log.resourceName}` : ''}`],
              ['Resource ID', log.resourceId || '-'],
              ['Status', log.success ? 'Success' : 'Failed'],
              ['Status Code', String(log.statusCode || '-')],
              ['Method', log.requestMethod || '-'],
              ['URL', log.requestUrl || '-'],
              ['Route', log.route || '-'],
              ['IP Address', log.ipAddress || '-'],
              ['Browser', log.browser || '-'],
              ['OS', log.operatingSystem || '-'],
              ['Device', log.deviceType || '-'],
              ['Timestamp', new Date(log.timestamp).toLocaleString()],
              ['Error', log.errorMessage || '-'],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="font-medium text-muted-foreground">{label}:</span>
                <span className="ml-2">{value}</span>
              </div>
            ))}
          </div>
          {log.changedFields && log.changedFields.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-1">Changed Fields</h4>
              <div className="flex flex-wrap gap-1">
                {log.changedFields.map((f) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
          )}
          {sections.map((s) => s.data && Object.keys(s.data).length > 0 && (
            <div key={s.label}>
              <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                <FileJson className="h-4 w-4" /> {s.label}
              </h4>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-60">
                {JSON.stringify(s.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const queryParams = useMemo(() => ({
    page,
    limit: 20,
    search: search || undefined,
    action: actionFilter || undefined,
    resourceType: resourceTypeFilter || undefined,
    success: successFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortOrder,
  }), [page, search, actionFilter, resourceTypeFilter, successFilter, startDate, endDate, sortOrder]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs', queryParams],
    queryFn: ({ signal }) => adminApi.listAuditLogs(queryParams, signal),
  });

  const { data: actionsData } = useQuery({
    queryKey: ['admin-audit-actions'],
    queryFn: ({ signal }) => adminApi.listAuditActions(signal),
    staleTime: 60000,
  });

  const { data: resourceTypesData } = useQuery({
    queryKey: ['admin-audit-resource-types'],
    queryFn: ({ signal }) => adminApi.listAuditResourceTypes(signal),
    staleTime: 60000,
  });

  const logs = data?.data?.data?.logs || [];
  const pagination = data?.data?.data?.pagination;
  const actions = actionsData?.data?.data || [];
  const resourceTypes = resourceTypesData?.data?.data || [];

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'Admin',
      accessor: (l) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden">
            {l.adminId?.avatar?.url
              ? <OptimizedImage src={l.adminId.avatar.url} alt={l.adminName || 'Admin'} placeholderType="avatar" className="object-cover" />
              : l.adminName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-medium">{l.adminName || l.adminEmail || 'System'}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: (l) => (
        <Badge className={actionColor(l.action)} variant="secondary">
          {formatAction(l.action)}
        </Badge>
      ),
    },
    {
      header: 'Resource',
      accessor: (l) => (
        <div>
          <span className="text-sm font-medium">{l.resourceType}</span>
          {l.resourceId && <code className="ml-1 rounded bg-muted px-1 text-xs">{l.resourceId.slice(-8)}</code>}
          {l.resourceName && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{l.resourceName}</p>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (l) => (
        <Badge variant={l.success ? 'default' : 'destructive'} className={l.success ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
          {l.success ? 'Success' : 'Failed'}
        </Badge>
      ),
    },
    {
      header: 'IP',
      accessor: (l) => l.ipAddress || '-',
      className: 'hidden lg:table-cell',
    },
    {
      header: 'Date',
      accessor: (l) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(l.timestamp || l.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: '',
      accessor: (l) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(l)}>
          <FileJson className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleExportCSV = () => {
    downloadCSV(toCSV(logs), `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const resetFilters = () => {
    setSearch('');
    setActionFilter('');
    setResourceTypeFilter('');
    setSuccessFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = search || actionFilter || resourceTypeFilter || successFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all administrative actions with complete change history
          </p>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
            <ArrowUpDown className="h-4 w-4 mr-1" /> {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
              <Input
                placeholder="Keyword..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>{formatAction(a)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Resource</label>
              <Select value={resourceTypeFilter} onValueChange={(v) => { setResourceTypeFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  {resourceTypes.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={successFilter} onValueChange={(v) => { setSuccessFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            </div>
          </div>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by admin name, email, action, resource..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {error ? (
        <Card className="p-8 text-center">
          <p className="text-destructive">Failed to load audit logs. Please try again.</p>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          emptyMessage="No audit logs found matching your filters."
        />
      )}

      <DetailModal log={selectedLog} open={!!selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
