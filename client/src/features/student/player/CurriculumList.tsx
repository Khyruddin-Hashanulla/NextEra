import { useEffect, useRef, useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CheckCircle2, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatLectureDuration } from './format';
import { lectureTypeIcon } from './LectureInfo';
import type { PlayerSection, PlayerLecture } from './types';

interface CurriculumListProps {
  sections: PlayerSection[];
  completedLectureIds: Set<string>;
  currentLectureId?: string;
  onSelect: (lecture: PlayerLecture) => void;
}

function findSectionIdForLecture(sections: PlayerSection[], lectureId?: string): string | undefined {
  if (!lectureId) return undefined;
  return sections.find((section) => section.lectures.some((lecture) => lecture._id === lectureId))?._id;
}

function SectionRow({ section, completedLectureIds, currentLectureId, onSelect }: {
  section: PlayerSection;
  completedLectureIds: Set<string>;
  currentLectureId?: string;
  onSelect: (lecture: PlayerLecture) => void;
}) {
  const completedCount = section.lectures.filter((lecture) => completedLectureIds.has(lecture._id)).length;
  const progress = section.lectures.length ? Math.round((completedCount / section.lectures.length) * 100) : 0;

  return (
    <AccordionItem value={section._id} className="rounded-xl border bg-card/60">
      <AccordionTrigger className="rounded-xl px-3 py-3 text-left hover:no-underline">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-semibold text-foreground">{section.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {section.lectures.length} lecture{section.lectures.length === 1 ? '' : 's'}
            </span>
            {progress > 0 && (
              <span className="text-xs text-muted-foreground">· {progress}% complete</span>
            )}
          </div>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label={`${section.title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-2">
        <div className="space-y-1 px-2" role="list" aria-label={`${section.title} lectures`}>
          {section.lectures.map((lecture) => {
            const isActive = currentLectureId === lecture._id;
            const isCompleted = completedLectureIds.has(lecture._id);
            const TypeIcon = lectureTypeIcon(lecture.type);
            return (
              <button
                key={lecture._id}
                type="button"
                onClick={() => onSelect(lecture)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isActive ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-muted'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'shrink-0',
                    isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', isActive ? 'font-medium text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground')}>
                    {lecture.title}
                    {isCompleted && <span className="sr-only">, completed</span>}
                    {isActive && <span className="sr-only">, currently playing</span>}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <TypeIcon className="h-3 w-3" aria-hidden="true" />
                    {formatLectureDuration(lecture.duration) ? (
                      <span className="tabular-nums">{formatLectureDuration(lecture.duration)}</span>
                    ) : (
                      <span className="capitalize">{lecture.type}</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function CurriculumList({ sections, completedLectureIds, currentLectureId, onSelect }: CurriculumListProps) {
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const activeSectionId = findSectionIdForLecture(sections, currentLectureId);
    return activeSectionId ? [activeSectionId] : sections[0] ? [sections[0]._id] : [];
  });
  const previousLectureId = useRef(currentLectureId);

  useEffect(() => {
    if (currentLectureId === previousLectureId.current) return;
    previousLectureId.current = currentLectureId;

    const activeSectionId = findSectionIdForLecture(sections, currentLectureId);
    if (activeSectionId) {
      setOpenSections((prev) => (prev.includes(activeSectionId) ? prev : [...prev, activeSectionId]));
    }
  }, [currentLectureId, sections]);

  if (!sections.length) {
    return <p className="px-4 py-6 text-center text-sm text-muted-foreground">No curriculum has been published yet.</p>;
  }

  return (
    <Accordion
      type="multiple"
      value={openSections}
      onValueChange={setOpenSections}
      className="space-y-2 px-2"
    >
      {sections.map((section) => (
        <SectionRow
          key={section._id}
          section={section}
          completedLectureIds={completedLectureIds}
          currentLectureId={currentLectureId}
          onSelect={onSelect}
        />
      ))}
    </Accordion>
  );
}