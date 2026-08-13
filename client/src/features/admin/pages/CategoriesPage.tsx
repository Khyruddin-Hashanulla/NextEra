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
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: ({ signal }) => adminApi.listCategories(signal).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      addToast({ title: 'Category created', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed to create category', variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      addToast({ title: 'Category updated', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed to update category', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      addToast({ title: 'Category deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed to delete', variant: 'error' }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', description: '', icon: '' });
  };

  const openEdit = (cat: any) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '' });
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
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-muted-foreground">Manage course categories</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', description: '', icon: '' });
            setShowForm(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Category
        </Button>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !categories?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <FolderTree className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No categories yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first category</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Slug</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Active
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categories.map((cat: any) => (
                      <tr key={cat._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{cat.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{cat.slug}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                          {cat.description || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {cat.isActive ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(cat._id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon (emoji or URL)</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="📚"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.name || createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete Category</h2>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure? This action cannot be undone.</p>
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
