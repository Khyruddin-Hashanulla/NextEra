import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Download, FileText, Megaphone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatAnnouncementDate } from './announcement-utils';
import type { Announcement } from '@/types/instructor';

interface AnnouncementDetailDialogProps {
  announcement: Announcement | null;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementDetailDialog({ announcement, onOpenChange }: AnnouncementDetailDialogProps) {
  return (
    <Dialog open={!!announcement} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg gap-0 overflow-y-auto overflow-x-hidden p-0 max-h-[90vh] grid-cols-[minmax(0,1fr)]">
        {announcement && (
          <>
            <div className="flex items-start gap-3 border-b px-6 py-5 pr-14">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="break-words text-base leading-snug">{announcement.title}</DialogTitle>
                <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{announcement.course?.title || 'Course'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatAnnouncementDate(announcement.createdAt)}
                  </span>
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {announcement.message}
                </p>
              </section>

              {announcement.attachments.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Attachments ({announcement.attachments.length})
                  </h2>
                  <div className="mt-2 space-y-2">
                    {announcement.attachments.map((file) => (
                      <div
                        key={file.publicId}
                        className="flex items-center justify-between gap-3 rounded-lg border p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="truncate text-sm">{file.name}</span>
                        </div>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}