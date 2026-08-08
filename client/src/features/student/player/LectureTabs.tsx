import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StickyNote, MessageSquare, Download, FileQuestion, FileCheck } from 'lucide-react';
import type { PlayerLecture } from './types';
import { NotesTab } from './tabs/NotesTab';
import { DiscussionTab } from './tabs/DiscussionTab';
import { ResourcesTab } from './tabs/ResourcesTab';
import { QuizTab } from './tabs/QuizTab';
import { AssignmentTab } from './tabs/AssignmentTab';

interface LectureTabsProps {
  courseId: string;
  lecture: PlayerLecture;
  value: string;
  onValueChange: (value: string) => void;
}

export function LectureTabs({ courseId, lecture, value, onValueChange }: LectureTabsProps) {
  const isQuizLecture = lecture.type === 'quiz';
  const isAssignmentLecture = lecture.type === 'assignment';

  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="h-full w-full flex-wrap items-center gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1 sm:h-10">
        <TabsTrigger value="notes"><StickyNote className="mr-1 h-4 w-4" aria-hidden="true" /> Notes</TabsTrigger>
        <TabsTrigger value="discussion"><MessageSquare className="mr-1 h-4 w-4" aria-hidden="true" /> Discussion</TabsTrigger>
        <TabsTrigger value="resources"><Download className="mr-1 h-4 w-4" aria-hidden="true" /> Resources</TabsTrigger>
        {isAssignmentLecture && (
          <>
            <TabsTrigger value="quiz"><FileQuestion className="mr-1 h-4 w-4" aria-hidden="true" /> Quiz</TabsTrigger>
            <TabsTrigger value="assignment"><FileCheck className="mr-1 h-4 w-4" aria-hidden="true" /> Assignment</TabsTrigger>
          </>
        )}
        {isQuizLecture && (
          <TabsTrigger value="quiz"><FileQuestion className="mr-1 h-4 w-4" aria-hidden="true" /> Quiz</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="notes" className="mt-3">
        <NotesTab courseId={courseId} lectureId={lecture._id} />
      </TabsContent>
      <TabsContent value="discussion" className="mt-3">
        <DiscussionTab courseId={courseId} lectureId={lecture._id} />
      </TabsContent>
      <TabsContent value="resources" className="mt-3">
        <ResourcesTab courseId={courseId} lectureId={lecture._id} />
      </TabsContent>
      {isAssignmentLecture && (
        <>
          <TabsContent value="quiz" className="mt-3">
            <QuizTab courseId={courseId} lectureId={lecture._id} lecture={lecture} />
          </TabsContent>
          <TabsContent value="assignment" className="mt-3">
            <AssignmentTab courseId={courseId} lectureId={lecture._id} />
          </TabsContent>
        </>
      )}
      {isQuizLecture && (
        <TabsContent value="quiz" className="mt-3">
          <QuizTab courseId={courseId} lectureId={lecture._id} lecture={lecture} />
        </TabsContent>
      )}
    </Tabs>
  );
}