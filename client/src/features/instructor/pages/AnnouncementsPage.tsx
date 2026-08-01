import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Plus, Trash2, Send, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ course: '', title: '', message: '', sendEmail: false });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'announcements', page],
    queryFn: ({ signal }) => instructorApi.listAnnouncements({ page, limit: 10 }, signal).then((r) => r.data.data),
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-muted-foreground">Communicate with your students</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Announcement
        </Button>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !data?.announcements?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Megaphone className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No announcements yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first announcement to reach your students</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Announcement
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Email</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.announcements.map((announcement: any) => (
                      <tr key={announcement._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{announcement.title}</td>
                        <td className="px-4 py-3">{announcement.course?.title || 'All Courses'}</td>
                        <td className="max-w-[300px] truncate px-4 py-3 text-muted-foreground">{announcement.message}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(announcement.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {announcement.sendEmail
                            ? <span className="text-xs font-medium text-green-600">Yes</span>
                            : <span className="text-xs text-muted-foreground">No</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(announcement._id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (data.pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Create Announcement</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
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
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title || !form.message || !form.course} loading={createMutation.isPending}>
                <Send className="mr-1.5 h-4 w-4" /> Send Announcement
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
