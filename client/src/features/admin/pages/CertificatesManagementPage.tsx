import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Search, Trash2, Download, ExternalLink } from 'lucide-react';

export function CertificatesManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-certificates', page, search],
    queryFn: () => adminApi.listCertificates({ page, limit: 10, search: search || undefined }),
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.revokeCertificate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-certificates'] }); addToast({ title: 'Certificate revoked', variant: 'success' }); setDeleteId(null); },
   });

  const certificates = data?.data?.data?.certificates || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'Student', accessor: (c: any) => c.user?.name || 'Unknown' },
    { header: 'Course', accessor: (c: any) => c.course?.title || '-' },
    { header: 'Certificate ID', accessor: (c: any) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.certificateId}</code> },
    { header: 'Issued', accessor: (c: any) => new Date(c.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: (c: any) => (
      <div className="flex gap-1">
        {c.certificateUrl && <Button variant="ghost" size="sm" onClick={() => window.open(c.certificateUrl, '_blank')}><ExternalLink className="h-3 w-3" /></Button>}
        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(c._id)}><Trash2 className="h-3 w-3" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certificates Management</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by student name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>
      <DataTable columns={columns} data={certificates} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId!)} title="Revoke Certificate" description="Are you sure you want to revoke this certificate?" variant="destructive" />
    </div>
  );
}
