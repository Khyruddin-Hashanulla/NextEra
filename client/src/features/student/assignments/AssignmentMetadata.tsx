import { Card, CardContent } from '@/components/ui/card';
import type { AssignmentDetailResponse } from '@/types/student';
import { Award, CalendarClock, Target } from 'lucide-react';

interface AssignmentMetadataProps {
  assignment: AssignmentDetailResponse['lecture']['assignment'];
}

export function AssignmentMetadata({ assignment }: AssignmentMetadataProps) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
      <Card>
        <CardContent className="flex h-full min-w-0 flex-col items-center justify-center gap-1 pt-6 text-center">
          <Award className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-medium text-muted-foreground">Max Marks</p>
          <p className="text-xl font-bold tabular-nums">{assignment.totalMarks}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex h-full min-w-0 flex-col items-center justify-center gap-1 pt-6 text-center">
          <Target className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-medium text-muted-foreground">Passing Marks</p>
          <p className="text-xl font-bold tabular-nums">{assignment.passingMarks}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex h-full min-w-0 flex-col items-center justify-center gap-1 pt-6 text-center">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-medium text-muted-foreground">Due Date</p>
          <p className="min-w-0 break-words text-xl font-bold">
            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}