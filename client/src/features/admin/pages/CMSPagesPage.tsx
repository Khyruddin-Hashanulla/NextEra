import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { CmsPage } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit3, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { CardGridSkeleton } from '@/components/skeletons/ListSkeleton';

export function CMSPagesPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '', layout: 'default', published: false  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cms-pages'],
    queryFn: ({ signal }) => adminApi.listCmsPages(signal),
   });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createCmsPage(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] }); addToast({ title: 'Page created', variant: 'success' }); setDialogOpen(false); },
   });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateCmsPage(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] }); addToast({ title: 'Page updated', variant: 'success' }); setDialogOpen(false); },
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCmsPage(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] }); addToast({ title: 'Page deleted', variant: 'success' }); setDeleteId(null); },
   });

  const pages = data?.data?.data || [];

  const openCreate = () => { setEditing(null); setForm({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '', layout: 'default', published: false }); setDialogOpen(true); };
  const openEdit = (p: CmsPage) => { setEditing(p); setForm({ title: p.title, slug: p.slug, content: p.content, metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '', layout: p.layout, published: p.published }); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CMS Pages</h1>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Page</Button>
      </div>

      {isLoading ? (
        <CardGridSkeleton cards={6} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page: CmsPage) => (
            <Card key={page._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{page.title}</CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{page.published ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{page.metaDescription || page.content?.slice(0, 100)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(page)}><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteId(page._id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pages.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">No CMS pages yet</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Page' : 'Create Page'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
              <div><Label>Meta Description</Label><Input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Layout</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })}>
                  <option value="default">Default</option><option value="full_width">Full Width</option><option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div className="flex items-end pb-2 gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Published</Label>
              </div>
            </div>
            <Button onClick={() => { const d = { ...form }; if (editing) updateMutation.mutate({ id: editing._id, d }); else createMutation.mutate(d); }} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update Page' : 'Create Page'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId!)} title="Delete Page" description="Are you sure?" variant="destructive" />
    </div>
  );
}
