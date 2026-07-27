import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { InstructorSubscriptionPlan } from '@/types/revenue';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit3, Trash2, Crown } from 'lucide-react';

const defaultFeatures = {
  freeCoursesLimit: 2,
  unlimitedCourses: false,
  storageLimitMB: 500,
  advancedAnalytics: false,
  coupons: false,
  liveClasses: false,
  featuredInstructor: false,
  prioritySupport: false,
  unlimitedStorage: false,
  premiumMarketing: false,
};

const featureLabels: Record<string, string> = {
  freeCoursesLimit: 'Free Course Limit',
  unlimitedCourses: 'Unlimited Courses',
  storageLimitMB: 'Storage (MB)',
  advancedAnalytics: 'Advanced Analytics',
  coupons: 'Coupons',
  liveClasses: 'Live Classes',
  featuredInstructor: 'Featured Instructor',
  prioritySupport: 'Priority Support',
  unlimitedStorage: 'Unlimited Storage',
  premiumMarketing: 'Premium Marketing',
};

export function InstructorSubscriptionPlansPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstructorSubscriptionPlan | null>(null);
  const [form, setForm] = useState<any>({ name: '', type: 'free', price: 0, durationDays: 30, description: '', features: { ...defaultFeatures }, status: 'active', sortOrder: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-instructor-plans'],
    queryFn: () => adminApi.listInstructorSubscriptionPlans().then((r) => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-instructor-plan-stats'],
    queryFn: () => adminApi.getInstructorSubscriptionStats().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createInstructorSubscriptionPlan(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-instructor-plans'] }); addToast({ title: 'Plan created', variant: 'success' }); setDialogOpen(false); },
    onError: () => addToast({ title: 'Create failed', variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateInstructorSubscriptionPlan(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-instructor-plans'] }); addToast({ title: 'Plan updated', variant: 'success' }); setDialogOpen(false); },
    onError: () => addToast({ title: 'Update failed', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteInstructorSubscriptionPlan(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-instructor-plans'] }); addToast({ title: 'Plan deleted', variant: 'success' }); setDeleteId(null); },
    onError: (err: any) => addToast({ title: err?.response?.data?.message || 'Delete failed', variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'free', price: 0, durationDays: 30, description: '', features: { ...defaultFeatures }, status: 'active', sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEdit = (p: InstructorSubscriptionPlan) => {
    setEditing(p);
    setForm({
      name: p.name, type: p.type, price: p.price, durationDays: p.durationDays,
      description: p.description, features: { ...defaultFeatures, ...p.features },
      status: p.status, sortOrder: p.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing._id, d: form });
    else createMutation.mutate(form);
  };

  const updateFeature = (key: string, value: any) => {
    setForm({ ...form, features: { ...form.features, [key]: value } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Subscription Plans</h1>
          <p className="text-muted-foreground">Manage instructor platform subscription plans (Starter, Pro, Premium)</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Plan</Button>
      </div>

      {statsData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-2xl font-bold">{statsData.total}</p><p className="text-xs text-muted-foreground">Total Subscriptions</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-green-600">{statsData.active}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold">₹{(statsData.revenue || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Revenue</p></CardContent></Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(plans || []).map((plan: InstructorSubscriptionPlan) => (
            <Card key={plan._id} className={plan.type === 'free' ? 'border-blue-200' : plan.name === 'Premium' ? 'border-yellow-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className={`h-4 w-4 ${plan.type === 'paid' ? 'text-yellow-500' : 'text-blue-400'}`} />
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{plan.type} · {plan.durationDays} days</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{plan.status}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-1">{plan.type === 'free' ? 'Free' : `₹${plan.price}`} <span className="text-sm font-normal text-muted-foreground">/{plan.durationDays}d</span></p>
                <p className="text-xs text-muted-foreground mb-3">{plan.totalSubscribers} subscribers</p>
                <ul className="space-y-1 mb-4">
                  {Object.entries(plan.features).map(([key, val]) => {
                    const label = featureLabels[key] || key;
                    if (typeof val === 'boolean') {
                      return <li key={key} className="text-xs flex items-start gap-2"><span className={val ? 'text-green-500' : 'text-red-400'}>{val ? '✓' : '✗'}</span> {label}</li>;
                    }
                    return <li key={key} className="text-xs flex items-start gap-2"><span className="text-blue-500">→</span> {label}: {val}</li>;
                  })}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Plan'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="free">Free</option><option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>Duration (days)</Label><Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.unlimitedCourses} onCheckedChange={(v) => updateFeature('unlimitedCourses', v)} />
                  <Label className="text-sm">Unlimited Courses</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.advancedAnalytics} onCheckedChange={(v) => updateFeature('advancedAnalytics', v)} />
                  <Label className="text-sm">Advanced Analytics</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.coupons} onCheckedChange={(v) => updateFeature('coupons', v)} />
                  <Label className="text-sm">Coupons</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.liveClasses} onCheckedChange={(v) => updateFeature('liveClasses', v)} />
                  <Label className="text-sm">Live Classes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.featuredInstructor} onCheckedChange={(v) => updateFeature('featuredInstructor', v)} />
                  <Label className="text-sm">Featured Instructor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.prioritySupport} onCheckedChange={(v) => updateFeature('prioritySupport', v)} />
                  <Label className="text-sm">Priority Support</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.unlimitedStorage} onCheckedChange={(v) => updateFeature('unlimitedStorage', v)} />
                  <Label className="text-sm">Unlimited Storage</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.features.premiumMarketing} onCheckedChange={(v) => updateFeature('premiumMarketing', v)} />
                  <Label className="text-sm">Premium Marketing</Label>
                </div>
                <div><Label className="text-sm">Free Course Limit</Label><Input type="number" value={form.features.freeCoursesLimit} onChange={(e) => updateFeature('freeCoursesLimit', Number(e.target.value))} /></div>
                <div><Label className="text-sm">Storage (MB)</Label><Input type="number" value={form.features.storageLimitMB} onChange={(e) => updateFeature('storageLimitMB', Number(e.target.value))} /></div>
              </div>
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete Plan"
        description="Are you sure you want to delete this plan? This cannot be undone."
        variant="destructive"
      />
    </div>
  );
}
