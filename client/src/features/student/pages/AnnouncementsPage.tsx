import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Megaphone, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export function AnnouncementsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student', 'announcements'],
    queryFn: () => studentApi.listAnnouncements({ page: 1, limit: 20 }).then((r: any) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const announcements = data?.announcements || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="mt-1 text-muted-foreground">Latest updates from your course instructors</p>
      </motion.div>

      {isError || !announcements.length ? (
        <motion.div variants={item}>
          <EmptyState
            icon={<Megaphone className="h-8 w-8" />}
            title="No announcements yet"
            description="Instructor updates for your enrolled courses will appear here"
          />
        </motion.div>
      ) : (
        <motion.div variants={container} className="space-y-3">
          {announcements.map((a: any) => (
            <motion.div key={a._id} variants={item} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.message}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {a.course?.title || 'Course'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}