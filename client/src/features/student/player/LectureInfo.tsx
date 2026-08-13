import { Badge } from '@/components/ui/badge';
import { FileCheck, FileQuestion, FileText, PlayCircle } from 'lucide-react';
import { formatLectureDuration } from './format';
import type { PlayerLecture } from './types';

export function lectureTypeLabel(type: PlayerLecture['type']): string {
  switch (type) {
    case 'video':
      return 'Video';
    case 'article':
      return 'Article';
    case 'quiz':
      return 'Quiz';
    case 'assignment':
      return 'Assignment';
    default:
      return type;
  }
}

export function lectureTypeIcon(type: PlayerLecture['type']) {
  switch (type) {
    case 'video':
      return PlayCircle;
    case 'article':
      return FileText;
    case 'quiz':
      return FileQuestion;
    case 'assignment':
      return FileCheck;
    default:
      return PlayCircle;
  }
}

interface LectureInfoProps {
  lecture: PlayerLecture;
  index?: number;
  total?: number;
}

export function LectureInfo({ lecture, index, total }: LectureInfoProps) {
  const TypeIcon = lectureTypeIcon(lecture.type);

  return (
    <div className="space-y-1.5">
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{lecture.title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <TypeIcon className="h-4 w-4" aria-hidden="true" />
          {lectureTypeLabel(lecture.type)}
        </span>
        {formatLectureDuration(lecture.duration) ? (
          <>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatLectureDuration(lecture.duration)}
            </span>
          </>
        ) : null}
        {typeof index === 'number' && typeof total === 'number' ? (
          <>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
            <Badge variant="secondary" className="normal-case">
              {index + 1} of {total}
            </Badge>
          </>
        ) : null}
      </div>
      {lecture.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{lecture.description}</p>
      ) : null}
    </div>
  );
}
