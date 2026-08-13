import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { SubscriptionPlan } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, Crown } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function SubscriptionPlansPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: 0,
    discountedPrice: 0,
    durationDays: 30,
    features: [''],
    level: 'basic',
    status: 'active',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: ({ signal }) => adminApi.listSubscriptionPlans(signal),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createSubscriptionPlan(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      addToast({ title: 'Plan created', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateSubscriptionPlan(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      addToast({ title: 'Plan updated', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriptionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      addToast({ title: 'Plan deleted', variant: 'success' });
      setDeleteId(null);
    },
  });

  const plans = data?.data?.data || [];

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      price: 0,
      discountedPrice: 0,
      durationDays: 30,
      features: [''],
      level: 'basic',
      status: 'active',
    });
    setDialogOpen(true);
  };
  const openEdit = (p: SubscriptionPlan) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      discountedPrice: p.discountedPrice || 0,
      durationDays: p.durationDays,
      features: p.features,
      level: p.level,
      status: p.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = { ...form, features: form.features.filter((f: string) => f.trim()) };
    if (editing) updateMutation.mutate({ id: editing._id, d: data });
    else createMutation.mutate(data);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="mt-1 text-muted-foreground">Manage platform subscription plans</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Plan
        </Button>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-1 h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : !plans.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Crown className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No subscription plans yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first subscription plan</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan: SubscriptionPlan) => (
            <motion.div key={plan._id} variants={item}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="capitalize">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {plan.level} · {plan.durationDays} days
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-3xl font-bold tracking-tight">
                    ₹{plan.price}{' '}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.durationDays}d</span>
                  </p>
                  {plan.discountedPrice ? (
                    <p className="mb-3 text-sm text-green-600">Discounted: ₹{plan.discountedPrice}</p>
                  ) : null}
                  <ul className="mb-4 space-y-1.5">
                    {plan.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                      <Edit3 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteId(plan._id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Edit Plan' : 'Create Plan'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discounted Price</Label>
                  <Input
                    type="number"
                    value={form.discountedPrice}
                    onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={form.features.join('\n')}
                  onChange={(e) => setForm({ ...form, features: e.target.value.split('\n') })}
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.status === 'active'}
                  onCheckedChange={(v) => setForm({ ...form, status: v ? 'active' : 'inactive' })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete Plan</h2>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure you want to delete this plan?</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteId)}
                loading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
