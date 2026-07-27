import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export function CouponsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '', discountType: 'percentage' as const, discountValue: 0,
    minAmount: 0, maxUses: 0, expiresAt: '',
   });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'coupons', page],
    queryFn: () => adminApi.listCoupons({ page, limit: 10 }).then((r) => r.data.data),
   });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons']});
      addToast({ title: 'Coupon created', variant: 'success' });
      resetForm();
    },
    onError: (err: any) => addToast({ title: 'Failed', description: err?.response?.data?.message, variant: 'error' }),
   });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => adminApi.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons']});
      addToast({ title: 'Coupon updated', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons']});
      addToast({ title: 'Coupon deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
   });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ code: '', discountType: 'percentage', discountValue: 0, minAmount: 0, maxUses: 0, expiresAt: ''});
  };

  const openEdit = (c: any) => {
    setEditingId(c._id);
    setForm({
      code: c.code, discountType: c.discountType, discountValue: c.discountValue,
      minAmount: c.minAmount, maxUses: c.maxUses,
      expiresAt: new Date(c.expiresAt).toISOString().split('T')[0],
     });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form});
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div>
      <AdminHeader title="Coupons" description="Manage discount coupons" />

      <div className="mb-4">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'code', header: 'Code' },
          {
            key: 'discountType',
            header: 'Type',
            render: (item: any) => (
              <span className="capitalize">{item.discountType === 'percentage' ? '%' : '₹'} {item.discountValue}{item.discountType === 'percentage' ? '%' : ''}</span>
            ),
          },
          {
            key: 'usage',
            header: 'Usage',
            render: (item: any) => `${item.usedCount} / ${item.maxUses || '∞'}`,
          },
          {
            key: 'expiresAt',
            header: 'Expires',
            render: (item: any) => new Date(item.expiresAt).toLocaleDateString(),
          },
          {
            key: 'isActive',
            header: 'Active',
            render: (item: any) => (item.isActive ? 'Yes' : 'No'),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item: any) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(item._id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        data={data?.coupons || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.pagination?.pages || 1}
        onPageChange={setPage}
        emptyMessage="No coupons found"
      />

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" disabled={!!editingId} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} placeholder="0 = unlimited" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.code || createMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Coupon"
        description="Are you sure?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
