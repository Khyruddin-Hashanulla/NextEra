import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { StatCard } from '@/features/admin/components/StatCard';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers/ToastProvider';
import { Eye, CheckCircle, XCircle, Search, Loader2, BookOpen, Clock, CheckCircle2, XCircle as XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', review: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700', archived: 'bg-red-100 text-red-700',
};

export function CourseManagementPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', page, search, statusFilter],
    queryFn: () => adminApi.listCourses({ page, limit: 10, search, status: statusFilter || undefined }),
   });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveCourse(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-courses'] }); addToast({ title: 'Course approved', variant: 'success' }); setConfirmAction(null); },
   });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectCourse(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-courses'] }); addToast({ title: 'Course rejected', variant: 'success' }); setConfirmAction(null); },
   });

  const courses = data?.data?.data?.courses || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'Title', accessor: (c: any) => (
      <div className="flex items-center gap-2">
        <div className="h-10 w-16 rounded bg-muted flex-shrink-0 overflow-hidden">
          {c.thumbnail?.url && <img src={c.thumbnail.url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <p className="font-medium truncate max-w-[200px]">{c.title}</p>
          <p className="text-xs text-muted-foreground">{c.instructor?.name || 'Unknown'}</p>
        </div>
      </div>
    ) },
    { header: 'Category', accessor: (c: any) => c.category?.name || '-' },
    { header: 'Level', accessor: (c: any) => <span className="capitalize">{c.level}</span> },
    { header: 'Price', accessor: (c: any) => c.pricing?.originalPrice ? `₹${c.pricing.originalPrice}` : 'Free' },
    { header: 'Status', accessor: (c: any) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || ''}`}>{c.status}</span>
    ) },
    { header: 'Enrollments', accessor: (c: any) => c.totalEnrollments || 0 },
    { header: 'Actions', accessor: (c: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/courses/${c._id}`)}><Eye className="h-3 w-3" /></Button>
        {c.status === 'review' && (
          <>
            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => setConfirmAction({ id: c._id, action: 'approve' })}><CheckCircle className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmAction({ id: c._id, action: 'reject' })}><XCircle className="h-3 w-3" /></Button>
          </>
        )}
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Course Management</h1>

      <div className="flex flex-wrap gap-2">
        <Button variant={statusFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(''); setPage(1); }}>All</Button>
        <Button variant={statusFilter === 'review' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('review'); setPage(1); }}>Pending Review</Button>
        <Button variant={statusFilter === 'published' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('published'); setPage(1); }}>Published</Button>
        <Button variant={statusFilter === 'draft' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('draft'); setPage(1); }}>Draft</Button>
        <Button variant={statusFilter === 'archived' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('archived'); setPage(1); }}>Archived</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
      </div>

      <DataTable columns={columns} data={courses} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />

      <ConfirmDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)} onConfirm={() => {
        if (confirmAction?.action === 'approve') approveMutation.mutate(confirmAction!.id);
        else rejectMutation.mutate(confirmAction!.id);
      }} title={confirmAction?.action === 'approve' ? 'Approve Course' : 'Reject Course'}
      description={`Are you sure you want to ${confirmAction?.action} this course?`} variant={confirmAction?.action === 'reject' ? 'destructive' : 'default'} isLoading={approveMutation.isPending || rejectMutation.isPending} />
    </div>
  );
}
