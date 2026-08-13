import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Banner } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { Switch } from '@/components/ui/switch';

export function BannerManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image: { url: '', publicId: '' },
    link: '',
    position: 'hero',
    order: 0,
    isActive: true,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: ({ signal }) => adminApi.listBanners(signal),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createBanner(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      addToast({ title: 'Banner created', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateBanner(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      addToast({ title: 'Banner updated', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      addToast({ title: 'Banner deleted', variant: 'success' });
      setDeleteId(null);
    },
  });

  const banners = data?.data?.data || [];

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      subtitle: '',
      image: { url: '', publicId: '' },
      link: '',
      position: 'hero',
      order: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };
  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      link: b.link || '',
      position: b.position,
      order: b.order,
      isActive: b.isActive,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} height={24} hasHeader={false} />
      ) : (
        <div className="space-y-3">
          {banners.map((banner: Banner) => (
            <Card key={banner._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="h-20 w-36 rounded bg-muted overflow-hidden flex-shrink-0">
                  {banner.image?.url && (
                    <OptimizedImage
                      src={banner.image.url}
                      alt={banner.title}
                      placeholderType="general"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{banner.title}</p>
                  {banner.subtitle && <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>}
                  <div className="flex gap-2 mt-1">
                    <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs capitalize">
                      {banner.position}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-muted-foreground">Order: {banner.order}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(banner)}>
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteId(banner._id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {banners.length === 0 && <p className="text-center text-muted-foreground py-8">No banners yet</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.image.url}
                onChange={(e) => setForm({ ...form, image: { ...form.image, url: e.target.value } })}
              />
            </div>
            <div>
              <Label>Link</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Position</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                >
                  <option value="hero">Hero</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="promo">Promo</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
            <Button
              onClick={() => {
                const d = { ...form };
                if (editing) updateMutation.mutate({ id: editing._id, d });
                else createMutation.mutate(d);
              }}
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Update' : 'Create'} Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete Banner"
        description="Are you sure?"
        variant="destructive"
      />
    </div>
  );
}
