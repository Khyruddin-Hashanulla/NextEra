import { describe, it, expect } from 'vitest';
import { filterLectureData, normalizeVideoSource } from './lectureData';

describe('normalizeVideoSource (YouTube)', () => {
  it('stores ONLY the 11-char videoId from a full watch URL and auto-generates the thumbnail', () => {
    const source = normalizeVideoSource({ source: 'youtube', videoId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: '' });
    expect(source.videoId).toBe('dQw4w9WgXcQ');
    expect(source.url).toBe('');
    expect(source.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
  });

  it('handles youtu.be, shorts, embed and bare IDs the same way', () => {
    const ids = [
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'dQw4w9WgXcQ',
    ];
    for (const raw of ids) {
      const source = normalizeVideoSource({ source: 'youtube', videoId: raw, url: '' });
      expect(source.videoId).toBe('dQw4w9WgXcQ');
      expect(source.url).toBe('');
      expect(source.thumbnailUrl).toContain('dQw4w9WgXcQ');
    }
  });

  it('returns a safe empty source when none is provided', () => {
    expect(normalizeVideoSource(undefined)).toEqual({
      source: 'none', url: '', videoId: '', provider: '', thumbnailUrl: '', playbackRate: 1, qualities: [],
    });
  });
});

describe('filterLectureData for video lectures', () => {
  it('keeps sectionId and persists a normalized youtube videoSource on save', () => {
    const payload = filterLectureData({
      title: 'Intro',
      type: 'video',
      duration: 120,
      isFree: true,
      sectionId: 's1',
      videoSource: { source: 'youtube', videoId: 'https://youtu.be/dQw4w9WgXcQ', url: '', thumbnailUrl: '', playbackRate: 1, qualities: [] },
    });
    expect(payload.type).toBe('video');
    expect(payload.sectionId).toBe('s1');
    expect(payload.videoSource.videoId).toBe('dQw4w9WgXcQ');
    expect(payload.videoSource.url).toBe('');
  });
});