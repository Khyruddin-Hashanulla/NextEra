import { useMemo } from 'react';
import { CalendarClock, FileCheck, FileQuestion, FileText, Loader2, PlayCircle, Trophy } from 'lucide-react';
import { resolveVideoEmbed } from '@/lib/video';
import { EmptyState } from '@/components/common/EmptyState';
import type { PlayerLecture } from './types';

interface VideoStageProps {
  lecture: PlayerLecture;
  onPosition?: (position: number) => void;
  onComplete?: () => void;
}

function UnavailableVideo({ lecture }: { lecture: PlayerLecture }) {
  const hasVideoMeta = Boolean(lecture.videoUrl?.url || lecture.videoSource?.url);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
        {hasVideoMeta ? (
          <Loader2 className="h-7 w-7 animate-spin text-white/80" />
        ) : (
          <PlayCircle className="h-7 w-7 text-white/80" />
        )}
      </div>
      <p className="text-sm font-medium text-white">
        {hasVideoMeta ? 'Loading video…' : 'This lecture has no published video yet.'}
      </p>
      {!hasVideoMeta && (
        <p className="max-w-sm text-sm text-white/60">
          The instructor hasn't uploaded video content for this lecture. Check back soon.
        </p>
      )}
    </div>
  );
}

function ArticleStage({ lecture }: { lecture: PlayerLecture }) {
  if (!lecture.articleContent?.trim()) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        title="This article is still being prepared"
        description="The instructor hasn't published written content for this lecture yet."
      />
    );
  }
  return (
    <div className="rounded-xl border bg-card ring-1 ring-border">
      <div
        className="lecture-article-content px-5 py-6 sm:px-8 sm:py-8"
        dangerouslySetInnerHTML={{ __html: lecture.articleContent }}
      />
    </div>
  );
}

function AssignmentStage({ lecture }: { lecture: PlayerLecture }) {
  const assignment = lecture.assignment;
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm font-medium">Assignment</p>
      </div>

      {assignment?.question ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{assignment.question}</p>
      ) : (
        <p className="text-sm text-muted-foreground">The instructor hasn't published the assignment prompt yet.</p>
      )}

      {assignment?.instructions ? (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">Instructions</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{assignment.instructions}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          Total marks: {assignment?.totalMarks ?? '—'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <FileCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Passing marks: {assignment?.passingMarks ?? '—'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Due: {dueDate ? dueDate.toLocaleDateString() : 'No deadline'}
        </span>
      </div>
    </div>
  );
}

function QuizOverlay({ lecture }: { lecture: PlayerLecture }) {
  const questionCount = lecture.quiz?.questions?.length || 0;
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center text-white">
        <FileQuestion className="mx-auto h-12 w-12 text-white/70" aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold">{questionCount} Question Quiz</p>
        {lecture.quiz?.timeLimit ? (
          <p className="mt-1 text-sm text-white/70">{lecture.quiz?.timeLimit} minute time limit</p>
        ) : null}
        {lecture.quiz?.passingScore ? (
          <p className="mt-1 text-sm text-white/70">Pass mark: {lecture.quiz?.passingScore}%</p>
        ) : null}
        <p className="mt-3 text-sm text-white/60">Complete the quiz below to finish this lecture.</p>
      </div>
    </div>
  );
}

export function VideoStage({ lecture, onPosition, onComplete }: VideoStageProps) {
  const embed = useMemo(() => resolveVideoEmbed(lecture), [lecture]);

  if (lecture.type === 'video') {
    if (embed.url) {
      const isYoutube = embed.type === 'youtube';
      return (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border">
          <iframe
            title={`${lecture.title || 'Lecture'} video`}
            src={embed.url}
            className="h-full w-full border-0"
            allow={
              isYoutube
                ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                : 'autoplay; fullscreen; picture-in-picture'
            }
            allowFullScreen
          />
        </div>
      );
    }

    if (lecture.videoUrl?.url) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border">
          <video
            key={lecture._id}
            src={lecture.videoUrl.url}
            controls
            preload="metadata"
            className="h-full w-full"
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              if (Math.floor(video.currentTime) % 15 === 0 && video.currentTime > 0) {
                onPosition?.(Math.floor(video.currentTime));
              }
            }}
            onEnded={() => onComplete?.()}
          />
        </div>
      );
    }

    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border">
        <UnavailableVideo lecture={lecture} />
      </div>
    );
  }

  if (lecture.type === 'article') {
    return <ArticleStage lecture={lecture} />;
  }

  if (lecture.type === 'assignment') {
    return <AssignmentStage lecture={lecture} />;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-border">
      <QuizOverlay lecture={lecture} />
    </div>
  );
}
