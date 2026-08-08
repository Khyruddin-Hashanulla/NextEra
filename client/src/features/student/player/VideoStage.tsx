import { useMemo } from 'react';
import { FileCheck, FileQuestion, FileText, Loader2, PlayCircle } from 'lucide-react';
import { resolveVideoEmbed } from '@/lib/video';
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
        {hasVideoMeta ? <Loader2 className="h-7 w-7 animate-spin text-white/80" /> : <PlayCircle className="h-7 w-7 text-white/80" />}
      </div>
      <p className="text-sm font-medium text-white">
        {hasVideoMeta ? 'Loading video…' : 'This lecture has no published video yet.'}
      </p>
      {!hasVideoMeta && (
        <p className="max-w-sm text-sm text-white/60">The instructor hasn't uploaded video content for this lecture. Check back soon.</p>
      )}
    </div>
  );
}

function ArticleStage({ lecture }: { lecture: PlayerLecture }) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="max-w-2xl text-center text-white">
        <FileText className="mx-auto h-12 w-12 text-white/70" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold">Article Content</p>
        {lecture.articleContent && <p className="mt-2 whitespace-pre-line text-sm text-white/70">{lecture.articleContent}</p>}
        {!lecture.articleContent && (
          <p className="mt-2 text-sm text-white/70">This lecture is read as an article. The written content will appear here soon.</p>
        )}
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
        {lecture.quiz?.timeLimit ? <p className="mt-1 text-sm text-white/70">{lecture.quiz?.timeLimit} minute time limit</p> : null}
        <p className="mt-3 text-sm text-white/60">Complete the quiz below to finish this lecture.</p>
      </div>
    </div>
  );
}

function AssignmentOverlay() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center text-white">
        <FileCheck className="mx-auto h-12 w-12 text-white/70" aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold">Assignment</p>
        <p className="mt-2 text-sm text-white/70">Complete the assignment below to finish this lecture.</p>
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
  }

  const overlay =
    lecture.type === 'article' ? (
      <ArticleStage lecture={lecture} />
    ) : lecture.type === 'quiz' ? (
      <QuizOverlay lecture={lecture} />
    ) : (
      <AssignmentOverlay />
    );

  if (lecture.type === 'video') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border">
        <UnavailableVideo lecture={lecture} />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-border">
      {overlay}
    </div>
  );
}