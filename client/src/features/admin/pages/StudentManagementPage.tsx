import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Search, Trash2, Ban, CheckCircle, Loader2 } from 'lucide-react';

export function StudentManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'ban' | 'unban' | 'delete' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', page, search],
    queryFn: () => adminApi.listStudents({ page, limit: 10, search: search || undefined }),
   });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateUserStatus(id, isActive),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-students'] }); addToast({ title: 'Student status updated', variant: 'success' }); setConfirmAction(null); },
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-students'] }); addToast({ title: 'Student deleted', variant: 'success' }); setConfirmAction(null); },
   });

  const students = data?.data?.data?.students || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'Student', accessor: (s: any) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {s.avatar?.url ? <img src={s.avatar.url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs font-medium">{s.name?.[0]}</div>}
        </div>
        <div>
          <p className="font-medium text-sm">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.email}</p>
        </div>
      </div>
    ) },
    { header: 'Email Verified', accessor: (s: any) => s.isEmailVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Ban className="h-4 w-4 text-red-500" /> },
    { header: 'Enrollments', accessor: (s: any) => s.totalEnrollments || 0 },
    { header: 'Status', accessor: (s: any) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.isActive ? 'Active' : 'Banned'}</span>
    ) },
    { header: 'Joined', accessor: (s: any) => new Date(s.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: (s: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className={s.isActive ? 'text-red-600' : 'text-green-600'} onClick={() => setConfirmAction({ id: s._id, action: s.isActive ? 'ban' : 'unban' })}>
          {s.isActive ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmAction({ id: s._id, action: 'delete' })}><Trash2 className="h-3 w-3" /></Button>
      </div>
    ) },
  ];

  const confirmTitle = confirmAction?.action === 'ban' ? 'Ban Student' : confirmAction?.action === 'unban' ? 'Unban Student' : 'Delete Student';
  const confirmDesc = confirmAction?.action === 'ban' ? 'This student will lose access to the platform.' : confirmAction?.action === 'unban' ? 'Restore access for this student?' : 'This will permanently delete the student and all their data?';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Management</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>
      <DataTable columns={columns} data={students} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />

      <ConfirmDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)} onConfirm={() => {
        if (confirmAction?.action === 'delete') deleteMutation.mutate(confirmAction!.id);
        else statusMutation.mutate({ id: confirmAction!.id, isActive: confirmAction?.action === 'unban'});
      }} title={confirmTitle} description={confirmDesc}
        variant={confirmAction?.action === 'delete' || confirmAction?.action === 'ban' ? 'destructive' : 'default'}
        isLoading={statusMutation.isPending || deleteMutation.isPending} />
    </div>
  );
}
