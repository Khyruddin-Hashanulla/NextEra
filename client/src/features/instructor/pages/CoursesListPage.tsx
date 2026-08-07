import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { isFreeCourse } from '@/lib/coursePricing';
import {
  Plus, Pencil, Trash2, Eye, Send, BookOpen, Users, DollarSign,
  ChevronRight,
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function CoursesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: ({ signal }) => instructorApi.listMyCourses(undefined, signal).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => instructorApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      addToast({ title: 'Course deleted', variant: 'success' });
      setDeleteId(null);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => instructorApi.submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      addToast({ title: 'Submitted for review', variant: 'success' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-0"><Skeleton className="aspect-video w-full rounded-t-lg" /><div className="space-y-2 p-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={cardItem} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-1 text-muted-foreground">Manage your course catalog</p>
        </div>
        <Button onClick={() => navigate('/instructor/courses/create')}>
          <Plus className="mr-1.5 h-4 w-4" /> New Course
        </Button>
      </motion.div>

      {!courses?.length ? (
        <motion.div variants={cardItem} className="flex flex-col items-center py-16 text-center">
          <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No courses yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create your first course to get started</p>
          <Button asChild className="mt-4">
            <Link to="/instructor/courses/create"><Plus className="mr-1.5 h-4 w-4" />Create Course</Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <motion.div key={course._id} variants={cardItem}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                <Link to={`/instructor/courses/${course._id}/edit`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                    {course.thumbnail?.url ? (
                      <OptimizedImage src={course.thumbnail.url} alt={course.title} placeholderType="course" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium shadow-sm',
                        course.status === 'published' ? 'bg-green-100 text-green-700' :
                        course.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-muted text-muted-foreground'
                      )}>{course.status}</span>
                    </div>
                  </div>
                </Link>
                <CardContent className="space-y-3 p-4">
                  <Link to={`/instructor/courses/${course._id}/edit`} className="line-clamp-1 text-base font-semibold transition-colors hover:text-primary">
                    {course.title || 'Untitled Course'}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.totalEnrollments || 0}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{isFreeCourse(course) ? 'Free' : `₹${course.price?.toLocaleString() ?? 0}`}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link to={`/instructor/courses/${course._id}/edit`} className="flex-1">
                      <Button size="sm" fullWidth variant="outline">
                        <Pencil className="mr-1.5 h-4 w-4" /> Edit
                      </Button>
                    </Link>
                    {course.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => submitMutation.mutate(course._id)} title="Submit for review">
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {course.status === 'published' && (
                      <Button size="sm" variant="outline" asChild title="Preview">
                        <Link to={`/courses/${course._id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(course._id)} title="Delete" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delete Course</h2>
            <p className="mt-2 text-sm text-muted-foreground">This will permanently delete the course and all its content.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
