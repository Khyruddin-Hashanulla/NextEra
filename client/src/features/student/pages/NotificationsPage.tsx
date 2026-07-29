import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import { Bell, CheckCheck, Mail, MailOpen, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'notifications'],
    queryFn: () => studentApi.listNotifications().then((r: any) => r.data.data),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => studentApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => studentApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
      addToast({ title: 'All marked as read', variant: 'success' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'Stay updated with your learning activities'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            {readAllMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-1.5 h-4 w-4" />
            )}
            Mark All Read
          </Button>
        )}
      </motion.div>

      {!notifications.length ? (
        <motion.div variants={item}>
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title="No notifications yet"
            description="We'll notify you when something new happens"
          />
        </motion.div>
      ) : (
        <motion.div variants={container} className="space-y-2">
          {notifications.map((n: any) => (
            <motion.div
              key={n._id}
              variants={item}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 transition-all',
                !n.isRead
                  ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-transparent'
                  : 'bg-card'
              )}
            >
              <div
                className={cn(
                  'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                )}
              >
                {n.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={cn(
                        'text-sm',
                        !n.isRead ? 'font-semibold' : 'text-foreground'
                      )}
                    >
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {n.link && (
                      <Link to={n.link}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => readMutation.mutate(n._id)}
                      >
                        <CheckCheck className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
