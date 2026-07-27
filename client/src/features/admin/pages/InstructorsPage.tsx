import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';

export function InstructorsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: instructors, isLoading } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: () => adminApi.getPendingInstructors().then((r) => r.data.data),
   });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveInstructor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors']});
      addToast({ title: 'Instructor approved', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to approve', variant: 'error' }),
   });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectInstructor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors']});
      addToast({ title: 'Instructor rejected', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to reject', variant: 'error' }),
   });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Instructor Approval" description="Review and manage instructor applications" />

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          {
            key: 'createdAt',
            header: 'Applied',
            render: (item: any) => new Date(item.createdAt).toLocaleDateString(),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item: any) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(item._id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectMutation.mutate(item._id)}
                  disabled={rejectMutation.isPending}
                  className="text-destructive"
                >
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>
            ),
          },
        ]}
        data={instructors || []}
        emptyMessage="No pending instructor applications"
      />
    </div>
  );
}
