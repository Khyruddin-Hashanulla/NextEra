import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { FaqItem } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { Switch } from '@/components/ui/switch';

export function FAQPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', order: 0, isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-faq'],
    queryFn: ({ signal }) => adminApi.listFaqs(signal),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createFaq(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faq'] });
      addToast({ title: 'FAQ created', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateFaq(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faq'] });
      addToast({ title: 'FAQ updated', variant: 'success' });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faq'] });
      addToast({ title: 'FAQ deleted', variant: 'success' });
      setDeleteId(null);
    },
  });

  const faqs = data?.data?.data || [];
  const categories = [...new Set(faqs.map((f: FaqItem) => f.category))];

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', answer: '', category: 'general', order: 0, isActive: true });
    setDialogOpen(true);
  };
  const openEdit = (f: FaqItem) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, category: f.category, order: f.order, isActive: f.isActive });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FAQ Management</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} height={20} hasHeader={false} />
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-lg font-semibold capitalize mb-3">{cat}</h2>
              {faqs
                .filter((f: FaqItem) => f.category === cat)
                .map((faq: FaqItem) => (
                  <Card key={faq._id} className="mb-2">
                    <CardContent className="p-0">
                      <button
                        className="flex w-full items-center justify-between p-4 text-left"
                        onClick={() => setExpanded(expanded === faq._id ? null : faq._id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${faq.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium">{faq.question}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(faq);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(faq._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          {expanded === faq._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                      {expanded === faq._id && (
                        <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground border-t pt-3">{faq.answer}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ))}
          {faqs.length === 0 && <p className="text-center text-muted-foreground py-8">No FAQs yet</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
              {editing ? 'Update FAQ' : 'Create FAQ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete FAQ"
        description="Are you sure?"
        variant="destructive"
      />
    </div>
  );
}
