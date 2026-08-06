import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Plus, Star, DollarSign, Calendar } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/ListSkeleton';

export function FeaturedPromotionsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ type: 'course', course: '', instructor: '', startDate: '', endDate: '', price: 0, position: 0, notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions', page, statusFilter],
    queryFn: ({ signal }) => adminApi.listFeaturedPromotions({ page, limit: 10, status: statusFilter || undefined }, signal).then((r) => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-promotion-stats'],
    queryFn: ({ signal }) => adminApi.getFeaturedPromotionStats(signal).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => adminApi.createFeaturedPromotion(d as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); addToast({ title: 'Promotion created', variant: 'success' }); setOpen(false); },
    onError: () => addToast({ title: 'Create failed', variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateFeaturedPromotion(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); addToast({ title: 'Promotion updated', variant: 'success' }); },
    onError: () => addToast({ title: 'Update failed', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFeaturedPromotion(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }); addToast({ title: 'Promotion deleted', variant: 'success' }); },
    onError: () => addToast({ title: 'Delete failed', variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ type: 'course', course: '', instructor: '', startDate: '', endDate: '', price: 0, position: 0, notes: '' });
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      type: item.type, course: item.course?._id || '', instructor: item.instructor?._id || '',
      startDate: item.startDate?.split('T')[0] || '', endDate: item.endDate?.split('T')[0] || '',
      price: item.price, position: item.position, notes: item.notes || '',
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing._id, d: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <AdminHeader title="Featured Promotions" description="Manage featured instructors and courses" />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-500" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Star className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold text-green-600">{stats.active}</p><p className="text-xs text-muted-foreground">Active</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-gray-500" /><div><p className="text-2xl font-bold">{stats.expired}</p><p className="text-xs text-muted-foreground">Expired</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold text-green-600">₹{(stats.revenue || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Revenue</p></div></div></CardContent></Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'active', 'expired', 'cancelled'].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s || 'All'}
            </Button>
          ))}
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New Promotion</Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} hasHeader={false} />
      ) : (
        <DataTable
          columns={[
            { key: 'type', header: 'Type', render: (item: any) => (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">{item.type}</span>
            )},
            { key: 'item', header: 'Item', render: (item: any) => (
              item.type === 'course' ? item.course?.title || 'N/A' : item.instructor?.name || 'N/A'
            )},
            { key: 'startDate', header: 'Start', render: (item: any) => new Date(item.startDate).toLocaleDateString() },
            { key: 'endDate', header: 'End', render: (item: any) => new Date(item.endDate).toLocaleDateString() },
            { key: 'price', header: 'Price', render: (item: any) => `₹${item.price.toLocaleString()}` },
            { key: 'status', header: 'Status', render: (item: any) => (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                item.status === 'active' ? 'bg-green-100 text-green-700' :
                item.status === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
              }`}>{item.status}</span>
            )},
            { key: 'position', header: 'Position' },
            { key: 'actions', header: '', render: (item: any) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteMutation.mutate(item._id)}>Delete</Button>
              </div>
            )},
          ]}
          data={data?.promotions || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No promotions found"
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Type</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="course">Course</option><option value="instructor">Instructor</option>
              </select>
            </div>
            {form.type === 'course' ? (
              <div><Label>Course ID</Label><Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course ID" /></div>
            ) : (
              <div><Label>Instructor ID</Label><Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="Instructor ID" /></div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Position</Label><Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
