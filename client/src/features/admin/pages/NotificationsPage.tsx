import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Plus, Trash2, Send, Bell, ChevronLeft, ChevronRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSingle, setShowSingle] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [singleForm, setSingleForm] = useState({ user: '', title: '', message: '', type: 'system' });
  const [bulkForm, setBulkForm] = useState({ title: '', message: '', type: 'system' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications', page],
    queryFn: ({ signal }) => adminApi.listNotifications({ page, limit: 10 }, signal).then((r) => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: ({ signal }) => adminApi.listUsers({ limit: 100 }, signal).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof singleForm) => adminApi.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      addToast({ title: 'Notification sent', variant: 'success' });
      setShowSingle(false);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
  });

  const bulkMutation = useMutation({
    mutationFn: (data: typeof bulkForm) => adminApi.sendNotificationToAll(data),
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      addToast({ title: `Notification sent to ${r.data?.data?.sentCount} users`, variant: 'success' });
      setShowBulk(false);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      addToast({ title: 'Deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-muted-foreground">Manage platform notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setSingleForm({ user: '', title: '', message: '', type: 'system' }); setShowSingle(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Send to User
          </Button>
          <Button onClick={() => { setBulkForm({ title: '', message: '', type: 'system' }); setShowBulk(true); }}>
            <Send className="mr-1.5 h-4 w-4" /> Send to All
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !data?.notifications?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Bell className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">Send your first notification to users</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.notifications.map((notif: any) => (
                      <tr key={notif._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{notif.title}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">{notif.message}</td>
                        <td className="px-4 py-3">{notif.user?.name || 'All Users'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                            {notif.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(notif.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(notif._id)}>
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

      {showSingle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Send Notification</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSingle(false)}>Close</Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <select value={singleForm.user} onChange={(e) => setSingleForm({ ...singleForm, user: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select user</option>
                  {(users?.users || []).map((u: any) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={singleForm.title} onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={singleForm.message} onChange={(e) => setSingleForm({ ...singleForm, message: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSingle(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(singleForm)} disabled={!singleForm.user || !singleForm.title || createMutation.isPending}>
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Send to All Users</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)}>Close</Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={bulkForm.title} onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={bulkForm.message} onChange={(e) => setBulkForm({ ...bulkForm, message: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
              <Button onClick={() => bulkMutation.mutate(bulkForm)} disabled={!bulkForm.title || bulkMutation.isPending}>
                Send to All
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete Notification</h2>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure?</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
