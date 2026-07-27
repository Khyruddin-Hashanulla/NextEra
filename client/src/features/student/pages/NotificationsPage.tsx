import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Bell, CheckCheck, Mail, MailOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const notifications = data?.notifications || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your learning activities</p>
        </div>
        {data?.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => readAllMutation.mutate()}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {!notifications.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div key={n._id} className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${!n.isRead ? 'bg-primary/5 border-primary/20' : ''}`}>
              <div className="mt-0.5">
                {n.isRead ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-medium' : ''}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link to={n.link}>
                    <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                )}
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => readMutation.mutate(n._id)}>
                    <CheckCheck className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
