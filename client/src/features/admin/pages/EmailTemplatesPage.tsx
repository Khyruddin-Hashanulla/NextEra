import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { EmailTemplate } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, Loader2, Eye, Code } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function EmailTemplatesPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', subject: '', body: '', variables: '', category: 'notification', isActive: true  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: () => adminApi.listEmailTemplates(),
   });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createEmailTemplate({ ...d, variables: d.variables ? d.variables.split(',').map((v: string) => v.trim()) : [] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] }); addToast({ title: 'Template created', variant: 'success' }); setDialogOpen(false); },
   });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateEmailTemplate(id, { ...d, variables: d.variables ? d.variables.split(',').map((v: string) => v.trim()) : undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] }); addToast({ title: 'Template updated', variant: 'success' }); setDialogOpen(false); },
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteEmailTemplate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] }); addToast({ title: 'Template deleted', variant: 'success' }); setDeleteId(null); },
   });

  const templates = data?.data?.data || [];

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', subject: '', body: '', variables: '', category: 'notification', isActive: true }); setDialogOpen(true); };
  const openEdit = (t: EmailTemplate) => { setEditing(t); setForm({ name: t.name, slug: t.slug, subject: t.subject, body: t.body, variables: t.variables?.join(', ') || '', category: t.category, isActive: t.isActive }); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Template</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: EmailTemplate) => (
            <Card key={t._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">[{t.category}] {t.slug}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2"><strong>Subject:</strong> {t.subject}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteId(t._id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">No email templates yet</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Template' : 'Create Template'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div>
              <Label>Body (HTML)</Label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={10} className="font-mono text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Variables (comma separated)</Label>
                <Input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="{{name}}, {{email}}" />
              </div>
              <div>
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="auth">Auth</option><option value="notification">Notification</option><option value="marketing">Marketing</option><option value="transactional">Transactional</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
            <Button onClick={() => { const d = { ...form }; if (editing) updateMutation.mutate({ id: editing._id, d }); else createMutation.mutate(d); }} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId!)} title="Delete Template" description="Are you sure?" variant="destructive" />
    </div>
  );
}
