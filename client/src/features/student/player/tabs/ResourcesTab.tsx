import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Link as LinkIcon } from 'lucide-react';
import { studentApi } from '@/api/endpoints/student';
import { EmptyState } from '@/components/common/EmptyState';
import type { PlayerLecture } from '../types';

interface ResourcesTabProps {
  courseId: string;
  lectureId: string;
  lecture?: PlayerLecture;
}

export function ResourcesTab({ courseId, lectureId, lecture }: ResourcesTabProps) {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['student', 'resources', lectureId],
    queryFn: () => studentApi.getLectureResources(lectureId, courseId).then((r: any) => r.data.data),
    enabled: !!lectureId,
  });

  const links = lecture?.links || [];
  const hasFiles = resources?.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-2 pt-4">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!hasFiles && links.length === 0) {
    return (
      <EmptyState
        icon={<Download className="h-6 w-6 text-muted-foreground" />}
        title="No resources available"
        description="There are no downloadable resources or useful links for this lecture."
      />
    );
  }

  return (
    <div className="space-y-4">
      {hasFiles && (
        <Card>
          <CardContent className="space-y-2 pt-4">
            {resources?.map((resource: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{resource.name || 'Resource ' + (i + 1)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{resource.type || 'Unknown'}</p>
                </div>
                <a href={resource.url} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="outline" size="sm">
                    <Download className="mr-1 h-3 w-3" /> Download
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {links.length > 0 && (
        <Card>
          <CardContent className="space-y-2 pt-4">
            <p className="text-sm font-medium">Useful Links</p>
            <p className="text-xs text-muted-foreground">
              Extra reading and helpful resources shared by the instructor.
            </p>
            {links.map((link) => (
              <a
                key={link.id || link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <LinkIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{link.label || link.url}</span>
                <span className="break-all text-xs text-muted-foreground">{link.url}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
