const YOUTUBE_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|attribution_link\?a=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_ID_RE = /(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/;

export interface VideoEmbedConfig {
  url: string;
  type: 'youtube' | 'vimeo' | null;
}

/**
 * Production-grade YouTube ID parser. Accepts:
 *  - a plain 11-char video ID
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/shorts/ID
 *  - https://www.youtube.com/embed/ID
 *  - https://www.youtube.com/v/ID
 *  - https://www.youtube.com/live/ID
 * Returns '' when no valid ID can be extracted.
 */
export function extractYouTubeId(value?: string | null): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  const match = YOUTUBE_ID_RE.exec(v);
  return match?.[1] || '';
}

export function extractVimeoId(value?: string | null): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^\d+$/.test(v)) return v;
  const match = VIMEO_ID_RE.exec(v);
  return match?.[1] || '';
}

/** Builds a normalized, privacy-enhanced YouTube embed URL for a given video ID. */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Generates a YouTube thumbnail for a video ID.
 * `maxresdefault.jpg` is HD; if it does not exist YouTube serves it as a 120x90
 * placeholder, so callers should fall back to `hqdefault` on load error.
 */
export function buildYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/** Swaps a YouTube maxresdefault thumbnail to the more reliable hqdefault. */
export function youtubeThumbnailFallback(url?: string | null): string {
  if (!url) return '';
  return url.replace('/maxresdefault.jpg', '/hqdefault.jpg');
}

/** Resolves any supported YouTube input (ID or URL) into a normalized embed URL, or '' if invalid. */
export function resolveYouTubeEmbedUrl(value?: string | null): string {
  const id = extractYouTubeId(value);
  return id ? buildYouTubeEmbedUrl(id) : '';
}

/** Builds a normalized Vimeo embed URL, or '' if invalid. */
export function resolveVimeoEmbedUrl(value?: string | null): string {
  const id = extractVimeoId(value);
  return id ? `https://player.vimeo.com/video/${id}` : '';
}

/** Decides which embed to use for a lecture's videoSource. */
export function resolveVideoEmbed(lecture: any): VideoEmbedConfig {
  const source = lecture?.videoSource?.source;
  if (source === 'youtube') {
    const url = resolveYouTubeEmbedUrl(lecture.videoSource.videoId) || resolveYouTubeEmbedUrl(lecture.videoSource.url);
    if (url) return { url, type: 'youtube' };
  }
  if (source === 'vimeo') {
    const url = resolveVimeoEmbedUrl(lecture.videoSource.videoId) || resolveVimeoEmbedUrl(lecture.videoSource.url);
    if (url) return { url, type: 'vimeo' };
  }
  return { url: '', type: null };
}

/**
 * Resolves a thumbnail for a course or lecture.
 * Precedence: uploaded thumbnail URL → YouTube auto-generated thumbnail → empty.
 */
export function resolveThumbnailUrl(uploadedUrl?: string | null, videoSource?: any): string {
  if (uploadedUrl) return uploadedUrl;
  if (videoSource?.source === 'youtube') {
    const id = extractYouTubeId(videoSource.videoId) || extractYouTubeId(videoSource.url);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  return '';
}
