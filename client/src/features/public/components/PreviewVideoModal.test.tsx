import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewVideoModal } from './PreviewVideoModal';

function lecture(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'l1',
    title: 'Preview Lecture',
    type: 'video',
    isFree: true,
    ...overrides,
  };
}

describe('PreviewVideoModal', () => {
  it('renders a YouTube iframe when the lecture uses a youtube videoSource', () => {
    render(
      <PreviewVideoModal
        open
        onOpenChange={vi.fn()}
        lecture={lecture({ videoSource: { source: 'youtube', videoId: 'dQw4w9WgXcQ', url: '', thumbnailUrl: '', provider: '', qualities: [], playbackRate: 1 } })}
      />
    );

    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');
    expect(iframe!.getAttribute('allowFullScreen')).not.toBeNull();
  });

  it('plays an uploaded/cloudinary video via a native player from videoSource.url', () => {
    render(
      <PreviewVideoModal
        open
        onOpenChange={vi.fn()}
        lecture={lecture({
          videoSource: { source: 'bunny', videoId: 'b1', url: 'https://cdn.example.com/stream/index.m3u8', provider: 'bunny', thumbnailUrl: '', qualities: [], playbackRate: 1 },
          videoUrl: { url: '', publicId: '' },
        })}
      />
    );

    expect(document.querySelector('iframe')).toBeNull();
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video!.getAttribute('src')).toBe('https://cdn.example.com/stream/index.m3u8');
  });

  it('plays an uploads/cloudinary video stored only in videoUrl.url', () => {
    render(
      <PreviewVideoModal
        open
        onOpenChange={vi.fn()}
        lecture={lecture({
          videoSource: { source: 'direct', videoId: '', url: '', thumbnailUrl: '', qualities: [], playbackRate: 1 },
          videoUrl: { url: 'https://res.cloudinary.com/x/video/upload/v1/abc.mp4', publicId: 'abc' },
        })}
      />
    );

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video!.getAttribute('src')).toBe('https://res.cloudinary.com/x/video/upload/v1/abc.mp4');
  });

  it('shows the unavailable message only when no resolvable source exists', () => {
    render(
      <PreviewVideoModal
        open
        onOpenChange={vi.fn()}
        lecture={lecture({ videoSource: { source: 'none', url: '', thumbnailUrl: '', qualities: [], playbackRate: 1 }, videoUrl: { url: '', publicId: '' } })}
      />
    );

    expect(screen.getByText('No video available for this lecture.')).toBeInTheDocument();
  });
});