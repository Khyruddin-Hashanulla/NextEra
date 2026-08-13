import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurriculumList } from './CurriculumList';
import type { PlayerSection, PlayerLecture } from './types';

export interface CourseCurriculumProps {
  sections: PlayerSection[];
  completedLectureIds: Set<string>;
  currentLectureId?: string;
  completedCount: number;
  completionPercent: number;
  onSelect: (lecture: PlayerLecture) => void;
  className?: string;
}

export function CourseCurriculum({
  sections,
  completedLectureIds,
  currentLectureId,
  completedCount,
  completionPercent,
  onSelect,
  className,
}: CourseCurriculumProps) {
  const totalLectures = sections.reduce((sum, section) => sum + section.lectures.length, 0);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Course content</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {completedCount} of {totalLectures} lectures completed
        </p>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Overall course progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercent}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-3">
        <CurriculumList
          sections={sections}
          completedLectureIds={completedLectureIds}
          currentLectureId={currentLectureId}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
