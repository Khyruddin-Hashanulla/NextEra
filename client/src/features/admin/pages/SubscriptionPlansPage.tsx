import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { SubscriptionPlan } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function SubscriptionPlansPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, discountedPrice: 0, durationDays: 30, features: [''], level: 'basic', status: 'active'  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: () => adminApi.listSubscriptionPlans(),
   });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createSubscriptionPlan(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] }); addToast({ title: 'Plan created', variant: 'success' }); setDialogOpen(false); },
   });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateSubscriptionPlan(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] }); addToast({ title: 'Plan updated', variant: 'success' }); setDialogOpen(false); },
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriptionPlan(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] }); addToast({ title: 'Plan deleted', variant: 'success' }); setDeleteId(null); },
   });

  const plans = data?.data?.data || [];

  const openCreate = () => { setEditing(null); setForm({ name: '', price: 0, discountedPrice: 0, durationDays: 30, features: [''], level: 'basic', status: 'active' }); setDialogOpen(true); };
  const openEdit = (p: SubscriptionPlan) => { setEditing(p); setForm({ name: p.name, price: p.price, discountedPrice: p.discountedPrice || 0, durationDays: p.durationDays, features: p.features, level: p.level, status: p.status }); setDialogOpen(true); };

  const handleSave = () => {
    const data = { ...form, features: form.features.filter((f) => f.trim()) };
    if (editing) updateMutation.mutate({ id: editing._id, d: data});
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Plan</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan: SubscriptionPlan) => (
            <Card key={plan._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="capitalize">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{plan.level} · {plan.durationDays} days</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{plan.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-3">₹{plan.price} <span className="text-sm font-normal text-muted-foreground">/{plan.durationDays}d</span></p>
                {plan.discountedPrice ? <p className="text-sm text-green-600 mb-3">Discounted: ₹{plan.discountedPrice}</p> : null}
                <ul className="space-y-1 mb-4">
                  {plan.features.map((f, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> {f}</li>)}
                </ul>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(plan)}><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteId(plan._id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Discounted Price</Label><Input type="number" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Duration (days)</Label><Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} /></div>
            <div><Label>Level</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="basic">Basic</option><option value="standard">Standard</option><option value="premium">Premium</option>
              </select>
            </div>
            <div><Label>Features (one per line)</Label>
              <Textarea value={form.features.join('\n')} onChange={(e) => setForm({ ...form, features: e.target.value.split('\n') })} rows={4} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.status === 'active'} onCheckedChange={(v) => setForm({ ...form, status: v ? 'active' : 'inactive' })} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId!)} title="Delete Plan" description="Are you sure?" variant="destructive" />
    </div>
  );
}
