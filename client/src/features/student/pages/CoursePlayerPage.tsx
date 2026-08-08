import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { CoursePlayerSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { categorizeError } from '@/lib/error-utils';
import { PlayCircle } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import type { PlayerCourseDetail, PlayerLecture } from '../player/types';
import { LearningHeader } from '../player/LearningHeader';
import { VideoStage } from '../player/VideoStage';
import { LectureInfo } from '../player/LectureInfo';
import { LectureNavigation } from '../player/LectureNavigation';
import { LectureTabs } from '../player/LectureTabs';
import { CourseCurriculum } from '../player/CourseCurriculum';
import { LiveRecordings } from '../player/LiveRecordings';

export function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'course-player', courseId],
    queryFn: () => studentApi.getCourseDetail(courseId!).then((r) => r.data.data),
    enabled: !!courseId,
  });

  const progressMutation = useMutation({
    mutationFn: (payload: { lectureId: string; position?: number; completed?: boolean }) =>
      studentApi.updateProgress(courseId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'course-player', courseId] });
    },
  });

  const [currentLecture, setCurrentLecture] = useState<PlayerLecture | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [curriculumOpen, setCurriculumOpen] = useState(false);

  const detail = data as PlayerCourseDetail | undefined;
  const sections = detail?.curriculum ?? [];
  const allLectures = useMemo(() => sections.flatMap((section) => section.lectures || []), [sections]);
  const currentIdx = currentLecture ? allLectures.findIndex((lecture) => lecture._id === currentLecture._id) : -1;

  useEffect(() => {
    if (!currentLecture && allLectures.length > 0) {
      setCurrentLecture(allLectures[0]);
    }
  }, [currentLecture, allLectures]);

  const handleLectureSelect = (lecture: PlayerLecture) => {
    setCurrentLecture(lecture);
    setActiveTab(lecture.type === 'quiz' ? 'quiz' : 'content');
    progressMutation.mutate({ lectureId: lecture._id, completed: false });
  };

  const handleComplete = () => {
    if (currentLecture) {
      progressMutation.mutate({ lectureId: currentLecture._id, completed: true });
      addToast({ title: 'Lecture marked as complete', variant: 'success' });
    }
  };

  const handleNext = () => {
    if (currentIdx >= 0 && currentIdx < allLectures.length - 1) {
      handleLectureSelect(allLectures[currentIdx + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      handleLectureSelect(allLectures[currentIdx - 1]);
    }
  };

  if (isLoading) {
    return <CoursePlayerSkeleton />;
  }

  if (error || !detail?.course) {
    if (!detail?.course && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="course" />;
    }
    const category = categorizeError(error);
    if (category === 'network') {
      return (
        <ErrorState
          title="Connection Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return (
      <ErrorState
        title="Course Not Found"
        message="This course doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!detail?.isEnrolled) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">You are not enrolled in this course.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/student/my-courses">My Courses</Link>
          </Button>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const course = detail.course!;
  const completedLectureIds = new Set(
    detail.enrollment?.completedLectures?.map((id) => String(id)) || []
  );
  const completionPercent = detail.enrollment?.completionPercentage || 0;

  return (
    <div className="min-h-screen">
      <LearningHeader
        courseTitle={course.title}
        completionPercent={completionPercent}
        onOpenCurriculum={() => setCurriculumOpen(true)}
      />

      <Sheet open={curriculumOpen} onOpenChange={setCurriculumOpen}>
        <SheetContent className="inset-y-0 right-0 flex w-full max-w-sm flex-col gap-0 overflow-hidden border-l bg-background p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Course curriculum</SheetTitle>
          <CourseCurriculum
            sections={sections}
            completedLectureIds={completedLectureIds}
            currentLectureId={currentLecture?._id}
            completedCount={completedLectureIds.size}
            completionPercent={completionPercent}
            onSelect={handleLectureSelect}
            className="min-h-0 flex-1"
          />
        </SheetContent>
      </Sheet>

      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-5">
          {currentLecture ? (
            <>
              <VideoStage
                lecture={currentLecture}
                onPosition={(position) => progressMutation.mutate({ lectureId: currentLecture._id, position })}
                onComplete={handleComplete}
              />
              <LectureInfo lecture={currentLecture} index={currentIdx < 0 ? undefined : currentIdx} total={allLectures.length} />
              <LectureNavigation
                onPrevious={handlePrev}
                onNext={handleNext}
                onMarkComplete={handleComplete}
                hasPrevious={currentIdx > 0}
                hasNext={currentIdx < allLectures.length - 1}
              />
              <div className="pt-1">
                <LectureTabs courseId={courseId!} lecture={currentLecture} value={activeTab} onValueChange={setActiveTab} />
              </div>
            </>
          ) : allLectures.length === 0 ? (
            <EmptyState
              icon={<PlayCircle className="h-8 w-8 text-muted-foreground" />}
              title="No lessons available yet."
              description="This course's curriculum is still being prepared by the instructor."
            />
          ) : (
            <EmptyState
              icon={<PlayCircle className="h-8 w-8 text-muted-foreground" />}
              title="Select a lecture to start learning"
              description="Pick a lecture on the right to begin."
            />
          )}

          <LiveRecordings courseId={courseId!} />
        </div>

        <aside className="hidden xl:block" aria-label="Course curriculum">
          <div className="sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-hidden rounded-2xl border bg-card lg:top-14">
            <CourseCurriculum
              sections={sections}
              completedLectureIds={completedLectureIds}
              currentLectureId={currentLecture?._id}
              completedCount={completedLectureIds.size}
              completionPercent={completionPercent}
              onSelect={handleLectureSelect}
              className="max-h-[calc(100vh-4.5rem)]"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}