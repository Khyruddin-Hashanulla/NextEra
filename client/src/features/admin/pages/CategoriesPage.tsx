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

export function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: ''  });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((r) => r.data.data),
   });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories']});
      addToast({ title: 'Category created', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed to create category', variant: 'error' }),
   });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories']});
      addToast({ title: 'Category updated', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed to update category', variant: 'error' }),
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories']});
      addToast({ title: 'Category deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed to delete', variant: 'error' }),
   });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', description: '', icon: ''});
  };

  const openEdit = (cat: any) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || ''});
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
      <AdminHeader title="Categories" description="Manage course categories" />

      <div className="mb-4">
        <Button onClick={() => { setEditingId(null); setForm({ name: '', description: '', icon: '' }); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'slug', header: 'Slug' },
          { key: 'description', header: 'Description' },
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
        data={categories || []}
        isLoading={isLoading}
        emptyMessage="No categories found"
      />

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji or URL)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📚" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Category"
        description="Are you sure? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
