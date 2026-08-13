import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Search, Trash2, RotateCcw, ExternalLink } from 'lucide-react';
import type { CertificateItem } from '@/types/admin';

export function CertificatesManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'revoke' | 'restore'>('revoke');
  const [revokeReason, setRevokeReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-certificates', page, search, statusFilter],
    queryFn: ({ signal }) =>
      adminApi.listCertificates(
        { page, limit: 10, search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter },
        signal
      ),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.revokeCertificate(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      addToast({ title: 'Certificate revoked', variant: 'success' });
      setActionId(null);
      setRevokeReason('');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certificates'] });
      addToast({ title: 'Certificate restored', variant: 'success' });
      setActionId(null);
    },
  });

  const certificates = data?.data?.data?.certificates || [];
  const pagination = data?.data?.data?.pagination;

  const handleRevoke = (id: string) => {
    setActionId(id);
    setActionType('revoke');
    setRevokeReason('');
  };

  const handleRestore = (id: string) => {
    setActionId(id);
    setActionType('restore');
  };

  const handleConfirmAction = () => {
    if (actionType === 'revoke') {
      revokeMutation.mutate({ id: actionId!, reason: revokeReason || undefined });
    } else {
      restoreMutation.mutate(actionId!);
    }
  };

  const columns = [
    { header: 'Student', accessor: (c: CertificateItem) => c.user?.name || 'Unknown' },
    { header: 'Course', accessor: (c: CertificateItem) => c.course?.title || '-' },
    {
      header: 'Certificate ID',
      accessor: (c: CertificateItem) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.certificateId}</code>
      ),
    },
    {
      header: 'Status',
      accessor: (c: CertificateItem) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {c.status === 'active' ? 'Active' : 'Revoked'}
        </span>
      ),
    },
    { header: 'Issued', accessor: (c: CertificateItem) => new Date(c.issuedAt).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: (c: CertificateItem) => (
        <div className="flex gap-1">
          {c.certificateUrl && (
            <Button variant="ghost" size="sm" onClick={() => window.open(c.certificateUrl, '_blank')}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          {c.status === 'active' && (
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleRevoke(c._id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {c.status === 'revoked' && (
            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleRestore(c._id)}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const confirmTitle = actionType === 'revoke' ? 'Revoke Certificate' : 'Restore Certificate';
  const confirmDescription =
    actionType === 'revoke'
      ? 'Are you sure you want to revoke this certificate? It will no longer be verifiable.'
      : 'Are you sure you want to restore this certificate? It will become verifiable again.';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certificates Management</h1>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={certificates}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />
      <ConfirmDialog
        open={!!actionId}
        onOpenChange={() => {
          setActionId(null);
          setRevokeReason('');
        }}
        onConfirm={handleConfirmAction}
        title={confirmTitle}
        description={confirmDescription}
        variant="destructive"
      />
    </div>
  );
}
