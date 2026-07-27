import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { liveClassApi } from '@/api/endpoints/liveClass';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import {
  Loader2, Calendar, Clock, Video, ExternalLink, User, Play, Monitor,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  live: 'bg-green-100 text-green-700',
  ended: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function LiveClassesPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const { data, isLoading } = useQuery({
    queryKey: ['student-live-classes', page, filter],
    queryFn: () => liveClassApi.listStudentLiveClasses({ page, limit: 10, filter }).then((r) => r.data.data),
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => liveClassApi.joinLiveClass(id),
    onSuccess: (res) => {
      const data = res.data.data;
      if (data.joinLink) {
        window.open(data.joinLink, '_blank');
      } else {
        addToast({ title: 'Joining...', variant: 'success' });
      }
    },
    onError: () => addToast({ title: 'Failed to join', variant: 'error' }),
  });

  const classes = data?.classes || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-muted-foreground">Upcoming and past live sessions for your courses</p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('upcoming'); setPage(1); }}>Upcoming</Button>
        <Button variant={filter === 'past' ? 'default' : 'outline'} size="sm" onClick={() => { setFilter('past'); setPage(1); }}>Past</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : classes.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          <Video className="mx-auto h-8 w-8 mb-2" />
          <p>No {filter} live classes</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((item: any) => {
            const startDate = new Date(item.startTime);
            const isLive = item.status === 'live';
            const isUpcoming = item.status === 'scheduled';

            return (
              <Card key={item._id} className={isLive ? 'border-green-300 ring-1 ring-green-200' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{item.course?.title}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] || ''}`}>
                      {isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />}
                      {item.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.duration} min
                    </div>
                    {item.instructor && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {item.instructor.name}
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}

                  <div className="mt-4 flex gap-2">
                    {(isLive || isUpcoming) && (
                      <Button size="sm" onClick={() => joinMutation.mutate(item._id)} disabled={joinMutation.isPending}>
                        {isLive ? <><Monitor className="mr-1 h-4 w-4" />Join Now</> : <><ExternalLink className="mr-1 h-4 w-4" />Join</>}
                      </Button>
                    )}
                    {item.zoomMeetingId && (
                      <Badge variant="outline" className="text-xs">ID: {item.zoomMeetingId}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
