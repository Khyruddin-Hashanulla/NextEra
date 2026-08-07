import { extractYouTubeId, buildYouTubeThumbnailUrl } from '@/lib/video';

export function filterLectureData(data: any): any {
  const { type, assignment, quiz, videoSource, articleContent, ...rest } = data;
  const filtered: any = { ...rest, type };

  if (type === 'video') {
    filtered.videoSource = normalizeVideoSource(videoSource);
    filtered.articleContent = '';
  } else if (type === 'article') {
    filtered.videoSource = undefined;
    filtered.articleContent = articleContent || '';
  } else if (type === 'assignment') {
    filtered.videoSource = undefined;
    filtered.articleContent = articleContent || '';
    filtered.assignment = assignment || { question: '', instructions: '', totalMarks: 100, passingMarks: 60 };
  } else if (type === 'quiz') {
    filtered.videoSource = undefined;
    filtered.articleContent = articleContent || '';
    filtered.quiz = quiz || {
      timeLimit: 0, passingScore: 60, maxAttempts: 3, showResults: true,
      randomizeQuestions: false, negativeMarking: false, partialMarking: false,
      attemptCooldownMinutes: 0, allowResume: true, shuffleOptions: false,
      scoringPolicy: 'best', questions: [],
    };
  }

  return filtered;
}

export function normalizeVideoSource(source: any): any {
  const empty = { source: 'none', url: '', videoId: '', provider: '', thumbnailUrl: '', playbackRate: 1, qualities: [] };
  if (!source) {
    return empty;
  }

  const videoSource: any = { ...empty, ...source };

  if (videoSource.source === 'youtube') {
    // Store ONLY the 11-char video ID, never the full URL.
    const id = extractYouTubeId(videoSource.videoId) || extractYouTubeId(videoSource.url);
    if (id) {
      videoSource.videoId = id;
      videoSource.url = '';
      videoSource.thumbnailUrl = buildYouTubeThumbnailUrl(id);
    }
  } else {
    // YouTube thumbnails are auto-generated; for others keep whatever is set.
    if (videoSource.source !== 'vimeo') {
      videoSource.source = videoSource.source || 'none';
    }
  }

  return videoSource;
}

export function getDefaultLectureData(type: string) {
  const base = { title: '', type, duration: 0, description: '', isFree: false, seoTitle: '', seoDescription: '', resources: [], attachments: [], notes: '', practiceFiles: [] };
  if (type === 'video') return { ...base, videoSource: { source: 'none', url: '', videoId: '' }, articleContent: '' };
  if (type === 'article') return { ...base, videoSource: undefined, articleContent: '' };
  if (type === 'assignment') return { ...base, videoSource: undefined, articleContent: '', assignment: { question: '', instructions: '', totalMarks: 100, passingMarks: 60 } };
  if (type === 'quiz') return { ...base, videoSource: undefined, articleContent: '', quiz: { timeLimit: 0, passingScore: 60, maxAttempts: 3, showResults: true, randomizeQuestions: false, negativeMarking: false, partialMarking: false, attemptCooldownMinutes: 0, allowResume: true, shuffleOptions: false, scoringPolicy: 'best', questions: [] } };
  return base;
}

export const EDITABLE_COURSE_FIELDS = [
  'title', 'description', 'shortDescription', 'thumbnail', 'introVideo',
  'welcomeMessage', 'congratulationMessage', 'pricing', 'price', 'category',
  'level', 'language', 'prerequisites', 'benefits', 'requirements', 'tags',
  'whatYouWillLearn', 'visibility', 'courseType', 'badge', 'certificateSettings', 'meta',
];

export function buildCourseUpdatePayload(form: any): any {
  const payload: Record<string, any> = {};

  for (const key of EDITABLE_COURSE_FIELDS) {
    if (form[key] !== undefined) {
      payload[key] = form[key];
    }
  }

  if (payload.category && typeof payload.category === 'object') {
    payload.category = payload.category._id;
  }

  return payload;
}
