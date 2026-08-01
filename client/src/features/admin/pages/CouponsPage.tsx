import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function CouponsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', discountType: 'percentage' as const, discountValue: 0, minAmount: 0, maxUses: 0, expiresAt: '' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'coupons', page],
    queryFn: ({ signal }) => adminApi.listCoupons({ page, limit: 10 }, signal).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      addToast({ title: 'Coupon created', variant: 'success' });
      resetForm();
    },
    onError: (err: any) => addToast({ title: 'Failed', description: err?.response?.data?.message, variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => adminApi.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      addToast({ title: 'Coupon updated', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      addToast({ title: 'Coupon deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed', variant: 'error' }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ code: '', discountType: 'percentage', discountValue: 0, minAmount: 0, maxUses: 0, expiresAt: '' });
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
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Coupon
        </Button>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !data?.coupons?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Tag className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No coupons found</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first coupon</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Usage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Expires</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Active</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.coupons.map((coupon: any) => (
                      <tr key={coupon._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                        <td className="px-4 py-3">
                          <span className="capitalize">
                            {coupon.discountType === 'percentage' ? '%' : '₹'} {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">{coupon.usedCount} / {coupon.maxUses || '∞'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(coupon.expiresAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {coupon.isActive
                            ? <span className="text-green-600">Yes</span>
                            : <span className="text-muted-foreground">No</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(coupon._id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <Button variant="ghost" size="sm" onClick={resetForm}>Close</Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" disabled={!!editingId} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
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
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.code || createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete Coupon</h2>
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
