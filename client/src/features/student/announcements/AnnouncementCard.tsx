import { BookOpen, ChevronRight, Clock, Megaphone } from 'lucide-react';
import { formatAnnouncementDate } from './announcement-utils';
import type { Announcement } from '@/types/instructor';

interface AnnouncementCardProps {
  announcement: Announcement;
  onOpen: () => void;
}

export function AnnouncementCard({ announcement, onOpen }: AnnouncementCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group w-full rounded-xl border bg-card p-5 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/15">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="break-words text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {announcement.title}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatAnnouncementDate(announcement.createdAt)}
            </span>
          </div>

          <p className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
            {announcement.message}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{announcement.course?.title || 'Course'}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Read announcement
              <ChevronRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}