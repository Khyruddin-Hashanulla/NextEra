import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { resolveVideoEmbed } from '@/lib/video';

interface PreviewLecture {
  _id: string;
  title: string;
  type?: string;
  videoSource?: any;
  videoUrl?: { url?: string; publicId?: string };
  duration?: number;
  description?: string;
}

interface PreviewVideoModalProps {
  lecture: PreviewLecture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function renderEmbed(lecture: PreviewLecture): React.ReactNode {
  const { url, type } = resolveVideoEmbed(lecture);
  if (url && (type === 'youtube' || type === 'vimeo')) {
    return (
      <iframe
        title={lecture.title || 'Lecture preview'}
        src={url}
        className="h-full w-full rounded-lg border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }
  const directUrl = lecture?.videoSource?.url || lecture?.videoUrl?.url;
  if (directUrl) {
    return <video key={directUrl} src={directUrl} controls autoPlay playsInline className="h-full w-full rounded-lg" />;
  }
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      No video available for this lecture.
    </div>
  );
}

export function PreviewVideoModal({ lecture, open, onOpenChange }: PreviewVideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{lecture?.title || 'Free Preview'}</DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span>Free preview</span>
            <DialogClose asChild>
              <button aria-label="Close preview" className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          {open && lecture ? renderEmbed(lecture) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
