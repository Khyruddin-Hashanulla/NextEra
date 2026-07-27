import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { Plus, Pencil, Trash2, Loader2, Eye, Send } from 'lucide-react';
import { useState } from 'react';

export function CoursesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: () => instructorApi.listMyCourses().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => instructorApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      addToast({ title: 'Course deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: () => addToast({ title: 'Failed to delete', variant: 'error' }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => instructorApi.submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      addToast({ title: 'Submitted for review', variant: 'success' });
    },
    onError: (err: any) => addToast({ title: 'Failed', description: err?.response?.data?.message, variant: 'error' }),
  });

  return (
    <div>
      <AdminHeader title="My Courses" description="Manage your courses" />

      <div className="mb-4">
        <Button onClick={() => navigate('/instructor/courses/create')}>
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'title', header: 'Title' },
          {
            key: 'status',
            header: 'Status',
            render: (item: any) => (
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                item.status === 'published' ? 'bg-green-50 text-green-700' :
                item.status === 'review' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'
              }`}>{item.status}</span>
            ),
          },
          { key: 'totalEnrollments', header: 'Enrollments' },
          { key: 'price', header: 'Price', render: (item: any) => item.price === 0 ? 'Free' : `₹${item.price}` },
          {
            key: 'actions',
            header: 'Actions',
            render: (item: any) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/instructor/courses/${item._id}/edit`)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                {item.status === 'draft' && (
                  <Button variant="ghost" size="sm" onClick={() => submitMutation.mutate(item._id)} title="Submit for review">
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                {item.status === 'published' && (
                  <Link to={`/courses/${item._id}`}>
                    <Button variant="ghost" size="sm" title="Preview">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(item._id)} title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        data={courses || []}
        isLoading={isLoading}
        emptyMessage="No courses yet. Create your first course!"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Course"
        description="This will permanently delete the course and all its content."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
