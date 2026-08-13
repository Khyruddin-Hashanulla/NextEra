import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Play } from 'lucide-react';
import { liveClassApi } from '@/api/endpoints/liveClass';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRecordedDuration } from './format';

interface LiveRecordingsProps {
  courseId: string;
}

export function LiveRecordings({ courseId }: LiveRecordingsProps) {
  const { data: recordingsData, isLoading } = useQuery({
    queryKey: ['student', 'course-recordings', courseId],
    queryFn: ({ signal }) =>
      liveClassApi.listStudentRecordings({ courseId, page: 1, limit: 20 }, signal).then((r) => r.data.data),
    enabled: !!courseId,
  });

  const recordings = recordingsData?.recordings || [];

  const recordView = (rec: any) => {
    if (rec._id) liveClassApi.incrementRecordingView(rec._id).catch(() => {});
  };

  return (
    <section aria-label="Live recordings" className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Video className="h-4 w-4 text-primary" aria-hidden="true" /> Live Recordings
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : recordings.length === 0 ? (
        <EmptyState
          icon={<Video className="h-6 w-6 text-muted-foreground" />}
          title="No live recordings yet"
          description="Recorded live classes for this course will appear here."
        />
      ) : (
        <div className="space-y-2">
          {recordings.map((rec: any) => (
            <Card key={rec._id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRecordedDuration(rec.duration)} · {new Date(rec.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {rec.url && (
                  <a href={rec.url} target="_blank" rel="noreferrer" onClick={() => recordView(rec)}>
                    <Button size="sm">
                      <Play className="mr-1 h-3 w-3" /> Watch
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
