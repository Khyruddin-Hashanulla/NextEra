import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { RolePermission } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldAlert, Save } from 'lucide-react';
import { CardGridSkeleton } from '@/components/skeletons/ListSkeleton';

const allModules = [
  'courses',
  'users',
  'payments',
  'reviews',
  'categories',
  'blog',
  'settings',
  'banners',
  'tickets',
  'certificates',
  'faq',
  'analytics',
];
const allActions = ['create', 'read', 'update', 'delete'];

const roleIcons: Record<string, any> = { admin: ShieldCheck, instructor: Shield, student: ShieldAlert };

export function RolePermissionsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RolePermission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formPermissions, setFormPermissions] = useState<{ module: string; actions: string[] }[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-role-permissions'],
    queryFn: ({ signal }) => adminApi.listRolePermissions(signal),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateRolePermission(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
      addToast({ title: 'Permissions updated', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const roles = data?.data?.data || [];

  const openEdit = (rp: RolePermission) => {
    setEditing(rp);
    const merged = allModules.map((module) => {
      const existing = rp.permissions.find((p: { module: string; actions: string[] }) => p.module === module);
      return { module, actions: existing?.actions || [] };
    });
    setFormPermissions(merged);
    setDialogOpen(true);
  };

  const toggleAction = (moduleIdx: number, action: string) => {
    setFormPermissions((prev) => {
      const copy = [...prev];
      const has = copy[moduleIdx].actions.includes(action);
      copy[moduleIdx] = {
        ...copy[moduleIdx],
        actions: has ? copy[moduleIdx].actions.filter((a) => a !== action) : [...copy[moduleIdx].actions, action],
      };
      return copy;
    });
  };

  const toggleAllForModule = (moduleIdx: number, enable: boolean) => {
    setFormPermissions((prev) => {
      const copy = [...prev];
      copy[moduleIdx] = { ...copy[moduleIdx], actions: enable ? [...allActions] : [] };
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Role & Permission Management</h1>

      {isLoading ? (
        <CardGridSkeleton cards={3} />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((rp: RolePermission) => {
            const Icon = roleIcons[rp.role] || Shield;
            return (
              <Card key={rp._id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-8 w-8 ${rp.role === 'admin' ? 'text-red-500' : rp.role === 'instructor' ? 'text-blue-500' : 'text-green-500'}`}
                    />
                    <div>
                      <CardTitle className="capitalize">{rp.role}</CardTitle>
                      {rp.description && <p className="text-xs text-muted-foreground">{rp.description}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-4">
                    {rp.permissions.slice(0, 5).map((p: { module: string; actions: string[] }) => (
                      <div key={p.module} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{p.module}</span>
                        <span className="text-xs text-muted-foreground">{p.actions.join(', ')}</span>
                      </div>
                    ))}
                    {rp.permissions.length > 5 && (
                      <p className="text-xs text-muted-foreground">+{rp.permissions.length - 5} more</p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => openEdit(rp)}>
                    <Shield className="mr-1 h-3 w-3" /> Edit Permissions
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{editing?.role} Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {formPermissions.map((perm, idx) => (
              <div key={perm.module} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{perm.module}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => toggleAllForModule(idx, true)}
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => toggleAllForModule(idx, false)}
                    >
                      None
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {allActions.map((action) => (
                    <Button
                      key={action}
                      variant={perm.actions.includes(action) ? 'default' : 'outline'}
                      size="sm"
                      className="capitalize text-xs"
                      onClick={() => toggleAction(idx, action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full"
              onClick={() =>
                updateMutation.mutate({
                  id: editing!._id,
                  d: { permissions: formPermissions.filter((p) => p.actions.length > 0) },
                })
              }
              disabled={updateMutation.isPending}
            >
              <Save className="mr-1 h-4 w-4" /> Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
