import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export function BlogPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; content: string; excerpt: string; status: 'draft' | 'published' }>({ title: '', content: '', excerpt: '', status: 'draft'  });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'blog', page],
    queryFn: () => adminApi.listBlogs({ page, limit: 10 }).then((r) => r.data.data),
   });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.createBlog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog']});
      addToast({ title: 'Blog created', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed to create blog', variant: 'error' }),
   });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => adminApi.updateBlog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog']});
      addToast({ title: 'Blog updated', variant: 'success' });
      resetForm();
    },
    onError: () => addToast({ title: 'Failed to update', variant: 'error' }),
   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog']});
      addToast({ title: 'Blog deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed to delete', variant: 'error' }),
   });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', content: '', excerpt: '', status: 'draft'});
  };

  const openEdit = (blog: any) => {
    setEditingId(blog._id);
    setForm({ title: blog.title, content: blog.content, excerpt: blog.excerpt || '', status: blog.status});
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
      <AdminHeader title="Blog" description="Manage blog posts" />

      <div className="mb-4">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'title', header: 'Title' },
          {
            key: 'author',
            header: 'Author',
            render: (item: any) => item.author?.name || 'N/A',
          },
          {
            key: 'status',
            header: 'Status',
            render: (item: any) => (
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {item.status}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (item: any) => new Date(item.createdAt).toLocaleDateString(),
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
        data={data?.blogs || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.pagination?.pages || 1}
        onPageChange={setPage}
      />

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief excerpt" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your content..." rows={10} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.title || !form.content || createMutation.isPending}>
              {editingId ? 'Update' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Post"
        description="Are you sure? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
