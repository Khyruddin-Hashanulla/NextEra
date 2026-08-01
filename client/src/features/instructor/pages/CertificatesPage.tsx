import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { TableSkeleton } from '@/components/skeletons/ListSkeleton';
import { Plus, Download, Award } from 'lucide-react';

export function CertificatesPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user: '', course: '' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'certificates', page],
    queryFn: ({ signal }) => instructorApi.listCertificates({ page, limit: 10 }, signal).then((r) => r.data.data),
  });

  const issueMutation = useMutation({
    mutationFn: () => instructorApi.issueCertificate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'certificates'] });
      addToast({ title: 'Certificate issued', variant: 'success' });
      setOpen(false);
      setForm({ user: '', course: '' });
    },
    onError: () => addToast({ title: 'Failed to issue certificate', variant: 'error' }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Issue and manage certificates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Issue Certificate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue Certificate</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} placeholder="User ID" />
              </div>
              <div className="space-y-2">
                <Label>Course ID</Label>
                <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course ID" />
              </div>
              <Button className="w-full" onClick={() => issueMutation.mutate()} disabled={issueMutation.isPending || !form.user || !form.course}>
                {issueMutation.isPending ? 'Issuing...' : <><Award className="mr-2 h-4 w-4" />Issue</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={[
            { key: 'user', header: 'Student', render: (item: any) => item.user?.name || item.user?.email },
            { key: 'course', header: 'Course', render: (item: any) => item.course?.title },
            { key: 'certificateId', header: 'Certificate ID', render: (item: any) => <span className="font-mono text-xs">{item.certificateId}</span> },
            { key: 'createdAt', header: 'Issued', render: (item: any) => new Date(item.createdAt).toLocaleDateString() },
            { key: 'certificateUrl', header: '', render: (item: any) => item.certificateUrl ? (
              <Button variant="ghost" size="sm" asChild><a href={item.certificateUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a></Button>
            ) : null },
          ]}
          data={data?.certificates || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No certificates issued yet"
        />
      )}
    </div>
  );
}
