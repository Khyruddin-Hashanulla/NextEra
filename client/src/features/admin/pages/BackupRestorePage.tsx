import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Plus, Trash2, Loader2, Download } from 'lucide-react';

export function BackupRestorePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: ({ signal }) => adminApi.listBackups(signal),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createBackup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
      addToast({ title: 'Backup created successfully', variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-backups'] });
      addToast({ title: 'Backup deleted', variant: 'success' });
      setDeleteId(null);
    },
  });

  const backups = data?.data?.data || [];

  const columns = [
    { header: 'File Name', accessor: (b: any) => b.fileName },
    { header: 'Type', accessor: (b: any) => <span className="capitalize">{b.type}</span> },
    { header: 'Size', accessor: (b: any) => (b.fileSize ? `${(b.fileSize / 1024).toFixed(1)} KB` : '-') },
    {
      header: 'Status',
      accessor: (b: any) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
        >
          {b.status}
        </span>
      ),
    },
    { header: 'Created', accessor: (b: any) => new Date(b.createdAt).toLocaleString() },
    {
      header: 'Actions',
      accessor: (b: any) => (
        <div className="flex gap-1">
          {b.url && (
            <Button variant="ghost" size="sm" onClick={() => window.open(b.url, '_blank')}>
              <Download className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(b._id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Backup & Restore</h1>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          Create Backup
        </Button>
      </div>

      <DataTable columns={columns} data={backups} isLoading={isLoading} emptyMessage="No backups yet" />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete Backup"
        description="Are you sure you want to delete this backup?"
        variant="destructive"
      />
    </div>
  );
}
