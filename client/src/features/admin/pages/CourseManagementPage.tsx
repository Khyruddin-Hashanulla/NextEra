import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, XCircle, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Course Management</h1>
        <p className="mt-1 text-muted-foreground">Review and manage all courses</p>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-2">
        {['', 'review', 'published', 'draft', 'archived'].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s || 'All'}
          </Button>
        ))}
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !courses.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No courses found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search filters</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Enrollments</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {courses.map((c: any) => (
                      <tr key={c._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-muted">
                              {c.thumbnail?.url && <img src={c.thumbnail.url} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate font-medium">{c.title}</p>
                              <p className="text-xs text-muted-foreground">{c.instructor?.name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{c.category?.name || '-'}</td>
                        <td className="px-4 py-3 capitalize">{c.level}</td>
                        <td className="px-4 py-3">{c.pricing?.originalPrice ? `₹${c.pricing.originalPrice}` : 'Free'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || ''}`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3">{c.totalEnrollments || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/courses/${c._id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {c.status === 'review' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-green-600" onClick={() => setConfirmAction({ id: c._id, action: 'approve' })}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmAction({ id: c._id, action: 'reject' })}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              {confirmAction.action === 'approve' ? 'Approve Course' : 'Reject Course'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to {confirmAction.action} this course?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                variant={confirmAction.action === 'reject' ? 'destructive' : 'default'}
                onClick={() => {
                  if (confirmAction.action === 'approve') approveMutation.mutate(confirmAction.id);
                  else rejectMutation.mutate(confirmAction.id);
                }}
                loading={approveMutation.isPending || rejectMutation.isPending}
              >
                {confirmAction.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
