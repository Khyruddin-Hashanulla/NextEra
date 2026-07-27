import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Plus, Trash2, Send } from 'lucide-react';

export function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ course: '', title: '', message: '', sendEmail: false });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'announcements', page],
    queryFn: () => instructorApi.listAnnouncements({ page, limit: 10 }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => instructorApi.createAnnouncement(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'announcements'] });
      addToast({ title: 'Announcement created', variant: 'success' });
      setOpen(false);
      setForm({ course: '', title: '', message: '', sendEmail: false });
    },
    onError: () => addToast({ title: 'Create failed', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => instructorApi.deleteAnnouncement(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor', 'announcements'] }); addToast({ title: 'Announcement deleted', variant: 'success' }); },
    onError: () => addToast({ title: 'Delete failed', variant: 'error' }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Communicate with your students</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Course ID</Label>
                <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Enter course ID" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="sendEmail" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="sendEmail">Send email notification</Label>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title || !form.message || !form.course}>
                {createMutation.isPending ? 'Sending...' : <><Send className="mr-2 h-4 w-4" />Send Announcement</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <DataTable
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'course', header: 'Course', render: (item: any) => item.course?.title || 'All Courses' },
            { key: 'message', header: 'Message', render: (item: any) => (
              <div className="max-w-[300px] truncate text-sm text-muted-foreground">{item.message}</div>
            )},
            { key: 'createdAt', header: 'Date', render: (item: any) => new Date(item.createdAt).toLocaleDateString() },
            { key: 'sendEmail', header: 'Email', render: (item: any) => item.sendEmail ? <span className="text-xs text-green-600">Yes</span> : <span className="text-xs text-muted-foreground">No</span> },
            {
              key: 'actions', header: '', render: (item: any) => (
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              ),
            },
          ]}
          data={data?.announcements || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No announcements yet"
        />
      )}
    </div>
  );
}
