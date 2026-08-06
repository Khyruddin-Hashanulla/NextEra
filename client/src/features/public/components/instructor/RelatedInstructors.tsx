import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Users } from 'lucide-react';
import { studentApi } from '@/api/endpoints/student';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from './Reveal';
import { InstructorCard } from '@/components/course/InstructorCard';
import type { InstructorCardData } from './types';

interface RelatedInstructorsProps {
  instructorId: string;
  instructorName: string;
}

const EXCLUDE_COUNT = 4;

export const RelatedInstructors = memo(function RelatedInstructors({
  instructorId,
  instructorName,
}: RelatedInstructorsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['public-instructors'],
    queryFn: ({ signal }) => studentApi.listInstructors(signal).then((r) => r.data.data || []),
    staleTime: 60_000,
  });

  const related = (data ?? [])
    .filter((item: InstructorCardData) => item._id !== instructorId)
    .slice(0, EXCLUDE_COUNT);

  return (
    <Reveal>
      <div id="related" className="scroll-mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Related Instructors</h2>
            <p className="mt-1 text-sm text-muted-foreground">More experts to learn from alongside {instructorName}</p>
          </div>
          {related.length > 0 && (
            <Link
              to="/instructors"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: EXCLUDE_COUNT }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : related.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
            title="No related instructors yet"
            description="More instructor profiles are on their way."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((instructor: InstructorCardData) => (
              <InstructorCard key={instructor._id} instructor={instructor} />
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
});
