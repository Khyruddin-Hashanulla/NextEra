import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers/ToastProvider';
import { Search, Shield, Ban, Trash2, Loader2 } from 'lucide-react';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter],
    queryFn: () => adminApi.listUsers({ page, limit: 10, search, role: roleFilter }).then((r) => r.data.data),
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users']});
      addToast({ title: 'User deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed to delete user', variant: 'error' }),
   });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users']});
      addToast({ title: 'User status updated', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to update status', variant: 'error' }),
   });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users']});
      addToast({ title: 'User role updated', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to update role', variant: 'error' }),
   });

  return (
    <div>
      <AdminHeader title="User Management" description="Manage all platform users" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          {
            key: 'role',
            header: 'Role',
            render: (item: any) => (
              <select
                value={item.role}
                onChange={(e) => roleMutation.mutate({ id: item._id, role: e.target.value })}
                className="rounded border px-2 py-1 text-xs capitalize bg-background"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            ),
          },
          {
            key: 'isActive',
            header: 'Status',
            render: (item: any) => (
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {item.isActive ? 'Active' : 'Banned'}
              </span>
            ),
          },
          {
            key: 'isEmailVerified',
            header: 'Verified',
            render: (item: any) => (
              <span className={item.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
                {item.isEmailVerified ? 'Yes' : 'No'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item: any) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => statusMutation.mutate({ id: item._id, isActive: !item.isActive })}
                  title={item.isActive ? 'Ban user' : 'Unban user'}
                >
                  <Ban className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(item._id)} title="Delete user">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.users || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.pagination?.pages || 1}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
