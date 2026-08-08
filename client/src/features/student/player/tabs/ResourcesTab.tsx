import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { studentApi } from '@/api/endpoints/student';
import { EmptyState } from '@/components/common/EmptyState';

interface ResourcesTabProps {
  courseId: string;
  lectureId: string;
}

export function ResourcesTab({ courseId, lectureId }: ResourcesTabProps) {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['student', 'resources', lectureId],
    queryFn: () => studentApi.getLectureResources(lectureId, courseId).then((r: any) => r.data.data),
    enabled: !!lectureId,
  });

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

  if (!resources?.length) {
    return (
      <EmptyState
        icon={<Download className="h-6 w-6 text-muted-foreground" />}
        title="No resources available"
        description="There are no downloadable resources for this lecture."
      />
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        {resources.map((resource: any, i: number) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{resource.name || 'Resource ' + (i + 1)}</p>
              <p className="text-xs text-muted-foreground capitalize">{resource.type || 'Unknown'}</p>
            </div>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" download>
              <Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" /> Download</Button>
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}