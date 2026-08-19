import { useState } from 'react';
import { useAnnouncements } from '@/features/student/announcements/useAnnouncements';
import { AnnouncementsHeader } from '@/features/student/announcements/AnnouncementsHeader';
import { AnnouncementCard } from '@/features/student/announcements/AnnouncementCard';
import { AnnouncementDetailDialog } from '@/features/student/announcements/AnnouncementDetailDialog';
import { AnnouncementsPagination } from '@/features/student/announcements/AnnouncementsPagination';
import { AnnouncementsSkeleton } from '@/features/student/announcements/AnnouncementsSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { categorizeError } from '@/lib/error-utils';
import type { Announcement } from '@/types/instructor';
import { Megaphone } from 'lucide-react';

export function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const { data, isLoading, error, refetch } = useAnnouncements(page);

  if (isLoading) {
    return <AnnouncementsSkeleton />;
  }

  if (error) {
    const category = categorizeError(error);
    return (
      <ErrorState
        title={category === 'network' ? 'Unable to reach the server' : 'Could not load announcements'}
        message={
          category === 'network'
            ? 'Check your internet connection and try again.'
            : 'Something went wrong while loading your announcements.'
        }
        onRetry={refetch}
      />
    );
  }

  const announcements = data?.announcements ?? [];

  return (
    <>
      <div className="space-y-6">
        <StaggerContainer>
          <div className="space-y-6">
            <AnnouncementsHeader total={data?.total} />

            {!announcements.length ? (
              <EmptyState
                icon={<Megaphone className="h-7 w-7 text-primary" />}
                title="No announcements yet"
                description="Instructor updates for your enrolled courses will appear here."
                action={{ label: 'Go to My Courses', href: '/student/my-courses' }}
              />
            ) : (
              <>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <StaggerItem key={announcement._id}>
                      <AnnouncementCard announcement={announcement} onOpen={() => setSelected(announcement)} />
                    </StaggerItem>
                  ))}
                </div>

                {data && (
                  <AnnouncementsPagination
                    page={page}
                    totalPages={data.totalPages}
                    total={data.total}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </StaggerContainer>
      </div>

      <AnnouncementDetailDialog
        announcement={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}