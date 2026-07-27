import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { Plus, Trash2, Send, Loader2 } from 'lucide-react';

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSingle, setShowSingle] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [singleForm, setSingleForm] = useState({ user: '', title: '', message: '', type: 'system'  });
  const [bulkForm, setBulkForm] = useState({ title: '', message: '', type: 'system'  });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notifications', page],
    queryFn: () => adminApi.listNotifications({ page, limit: 10 }).then((r) => r.data.data),
   });

  const { data: users } = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: () => adminApi.listUsers({ limit: 100 }).then((r) => r.data.data),
   });

  const createMutation = useMutation({
    mutationFn: (data: typeof singleForm) => adminApi.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications']});
      addToast({ title: 'Notification sent', variant: 'success' });
      setShowSingle(false);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
   });

  const bulkMutation = useMutation({
    mutationFn: (data: typeof bulkForm) => adminApi.sendNotificationToAll(data),
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications']});
      addToast({ title: `Notification sent to ${r.data?.data?.sentCount} users`, variant: 'success' });
      setShowBulk(false);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications']});
      addToast({ title: 'Deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
   });

  return (
    <div>
      <AdminHeader title="Notifications" description="Manage platform notifications" />

      <Tabs defaultValue="all">
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSingle(true)}>
              <Plus className="mr-2 h-4 w-4" /> Send to User
            </Button>
            <Button onClick={() => setShowBulk(true)}>
              <Send className="mr-2 h-4 w-4" /> Send to All
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          <DataTable
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'message', header: 'Message' },
              {
                key: 'user',
                header: 'User',
                render: (item: any) => item.user?.name || 'All Users',
              },
              { key: 'type', header: 'Type' },
              {
                key: 'createdAt',
                header: 'Date',
                render: (item: any) => new Date(item.createdAt).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (item: any) => (
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(item._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                ),
              },
            ]}
            data={data?.notifications || []}
            isLoading={isLoading}
            page={page}
            totalPages={data?.pagination?.pages || 1}
            onPageChange={setPage}
            emptyMessage="No notifications"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showSingle} onOpenChange={setShowSingle}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <select value={singleForm.user} onChange={(e) => setSingleForm({ ...singleForm, user: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSingle(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(singleForm)} disabled={!singleForm.user || !singleForm.title}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send to All Users</DialogTitle></DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={() => bulkMutation.mutate(bulkForm)} disabled={!bulkForm.title}>Send to All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Notification"
        description="Are you sure?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
