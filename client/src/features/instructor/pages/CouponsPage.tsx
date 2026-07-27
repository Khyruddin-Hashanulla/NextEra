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
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

export function CouponsPage() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'coupons', page],
    queryFn: () => instructorApi.listCoupons({ page, limit: 10 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => instructorApi.deleteCoupon(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor', 'coupons'] }); addToast({ title: 'Coupon deleted', variant: 'success' }); },
    onError: () => addToast({ title: 'Delete failed', variant: 'error' }),
  });

  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: 0, minAmount: 0, maxUses: 0, expiresAt: '', isActive: true, course: '' });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? instructorApi.updateCoupon(editing._id, form as any)
        : instructorApi.createCoupon(form as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'coupons'] });
      addToast({ title: editing ? 'Coupon updated' : 'Coupon created', variant: 'success' });
      setOpen(false);
      setEditing(null);
      setForm({ code: '', discountType: 'percentage', discountValue: 0, minAmount: 0, maxUses: 0, expiresAt: '', isActive: true, course: '' });
    },
    onError: () => addToast({ title: 'Save failed', variant: 'error' }),
  });

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minAmount: coupon.minAmount, maxUses: coupon.maxUses, expiresAt: coupon.expiresAt?.split('T')[0] || '', isActive: coupon.isActive, course: coupon.course?._id || '' });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage discount coupons</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Coupon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Minimum Amount</Label>
                  <Input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Course ID (optional)</Label>
                <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Leave empty for all courses" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.code}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
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
            { key: 'code', header: 'Code', render: (item: any) => <span className="font-mono font-bold">{item.code}</span> },
            { key: 'discountValue', header: 'Discount', render: (item: any) => item.discountType === 'percentage' ? `${item.discountValue}%` : `₹${item.discountValue}` },
            { key: 'usedCount', header: 'Used', render: (item: any) => `${item.usedCount || 0}/${item.maxUses || '∞'}` },
            { key: 'expiresAt', header: 'Expires', render: (item: any) => item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never' },
            { key: 'isActive', header: 'Active', render: (item: any) => <input type="checkbox" checked={item.isActive} disabled className="h-4 w-4" /> },
            {
              key: 'actions', header: '', render: (item: any) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ),
            },
          ]}
          data={data?.coupons || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No coupons created yet"
        />
      )}
    </div>
  );
}
