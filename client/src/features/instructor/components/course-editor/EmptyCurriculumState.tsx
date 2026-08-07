import { Button } from '@/components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';

export function EmptyCurriculumState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <FileText className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold">Build your course curriculum</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Create sections to organize your lectures. Each section can contain videos, articles, quizzes and assignments.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <PlusCircle className="mr-1 h-4 w-4" /> Add your first section
      </Button>
    </div>
  );
}
