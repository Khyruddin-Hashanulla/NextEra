import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import FeatureGate from '@/components/instructor/FeatureGate';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function CouponsPage() {
  return (
    <FeatureGate feature="coupons">
      <CouponsContent />
    </FeatureGate>
  );
}

function CouponsContent() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'coupons', page],
    queryFn: ({ signal }) => instructorApi.listCoupons({ page, limit: 10 }, signal).then((r) => r.data.data),
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-muted-foreground">Manage discount coupons for your courses</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ code: '', discountType: 'percentage', discountValue: 0, minAmount: 0, maxUses: 0, expiresAt: '', isActive: true, course: '' }); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> New Coupon
        </Button>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !data?.coupons?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Tag className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No coupons created yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first coupon to offer discounts</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Coupon
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Used</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Expires</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Active</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.coupons.map((coupon: any) => (
                      <tr key={coupon._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold">{coupon.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </td>
                        <td className="px-4 py-3">{coupon.usedCount || 0}/{coupon.maxUses || '∞'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={coupon.isActive} disabled className="h-4 w-4 rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(coupon._id)}>
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setEditing(null); }}>Close</Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
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
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.code}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
