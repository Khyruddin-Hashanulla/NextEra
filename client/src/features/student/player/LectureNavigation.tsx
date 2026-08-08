import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface LectureNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function LectureNavigation({ onPrevious, onNext, onMarkComplete, hasPrevious, hasNext }: LectureNavigationProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious} className="justify-center">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </Button>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="outline" onClick={onMarkComplete} className="flex-1 justify-center sm:flex-none">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Mark Complete
        </Button>
        <Button onClick={onNext} disabled={!hasNext} className="flex-1 justify-center sm:flex-none">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}