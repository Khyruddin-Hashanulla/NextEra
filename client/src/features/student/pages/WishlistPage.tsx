import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import { Heart, Trash2, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function WishlistPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: items, isLoading } = useQuery({
    queryKey: ['student', 'wishlist'],
    queryFn: () => studentApi.listWishlist().then((r: any) => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (courseId: string) => studentApi.toggleWishlist(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'wishlist'] });
      addToast({ title: 'Removed from wishlist', variant: 'success' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
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
      <motion.div variants={cardItem}>
        <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
        <p className="mt-1 text-muted-foreground">Courses you've saved for later</p>
      </motion.div>

      {!items?.length ? (
        <motion.div variants={cardItem}>
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="Your wishlist is empty"
            description="Browse courses and save the ones you're interested in"
            action={{ label: 'Browse Courses', href: '/courses' }}
          />
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => (
            <motion.div key={item._id} variants={cardItem} layout>
              <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                <Link to={`/courses/${item.course?._id}`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {item.course?.thumbnail?.url ? (
                      <img
                        src={item.course.thumbnail.url}
                        alt={item.course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <Link
                      to={`/courses/${item.course?._id}`}
                      className="line-clamp-1 text-base font-semibold transition-colors hover:text-primary"
                    >
                      {item.course?.title || 'Untitled Course'}
                    </Link>
                    {item.course?.instructor?.name && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.course.instructor.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold tabular-nums">
                      {item.course?.price === 0 ? (
                        <span className="text-green-600 dark:text-green-400">Free</span>
                      ) : (
                        `₹${item.course?.price?.toLocaleString() ?? 0}`
                      )}
                    </span>
                    {item.course?.level && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                        {item.course.level}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link to={`/courses/${item.course?._id}`} className="flex-1">
                      <Button size="sm" fullWidth>
                        <BookOpen className="mr-1.5 h-4 w-4" />
                        View Course
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMutation.mutate(item.course?._id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
