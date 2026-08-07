import { describe, it, expect } from 'vitest';
import {
  extractYouTubeId,
  extractVimeoId,
  buildYouTubeEmbedUrl,
  resolveYouTubeEmbedUrl,
  resolveVideoEmbed,
  buildYouTubeThumbnailUrl,
  youtubeThumbnailFallback,
} from '@/lib/video';

describe('YouTube ID extraction', () => {
  it('accepts a bare 11-char ID', () => {
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts the ID from every industry-standard URL shape', () => {
    const urls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://youtube.com/live/dQw4w9WgXcQ',
      'https://www.youtube.com/v/dQw4w9WgXcQ',
    ];
    for (const url of urls) {
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
      expect(resolveYouTubeEmbedUrl(url)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');
    }
  });

  it('returns empty for invalid input', () => {
    expect(extractYouTubeId('not-a-real-id')).toBe('');
    expect(extractYouTubeId('')).toBe('');
    expect(extractYouTubeId('https://example.com/abc')).toBe('');
  });
});

describe('Thumbnail generation', () => {
  it('builds a maxresdefault thumbnail URL and allows hqdefault fallback', () => {
    expect(buildYouTubeThumbnailUrl('dQw4w9WgXcQ')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    expect(youtubeThumbnailFallback('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });
});

describe('resolveVideoEmbed', () => {
  it('resolves a youtube lecture from a stored URL in videoId', () => {
    const embed = resolveVideoEmbed({
      videoSource: { source: 'youtube', videoId: 'https://youtu.be/dQw4w9WgXcQ', url: '' },
    });
    expect(embed.type).toBe('youtube');
    expect(embed.url).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');
  });

  it('resolves a vimeo lecture from a numeric id', () => {
    const embed = resolveVideoEmbed({ videoSource: { source: 'vimeo', videoId: '76979871', url: '' } });
    expect(embed.type).toBe('vimeo');
    expect(embed.url).toBe('https://player.vimeo.com/video/76979871');
    expect(extractVimeoId('https://player.vimeo.com/video/76979871')).toBe('76979871');
  });

  it('returns no embed for uploaded/native sources', () => {
    const embed = resolveVideoEmbed({ videoSource: { source: 'direct', videoId: 'a', url: 'https://cdn/x.mp4' } });
    expect(embed).toEqual({ url: '', type: null });
  });
});

describe('embed URL never uses a raw watch URL inside the iframe src', () => {
  it('produces a privacy-enhanced embed host', () => {
    expect(buildYouTubeEmbedUrl('dQw4w9WgXcQ')).not.toContain('watch?v=');
    expect(buildYouTubeEmbedUrl('dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/');
  });
});