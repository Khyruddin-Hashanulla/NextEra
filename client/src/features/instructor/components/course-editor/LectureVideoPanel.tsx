import { Input } from '@/components/ui/input';
import { FileUploader } from './FileUploader';
import { uploadApi } from '@/api/endpoints/upload';
import { VideoSource } from '@/types/instructor';
import {
  extractYouTubeId,
  buildYouTubeThumbnailUrl,
  youtubeThumbnailFallback,
} from '@/lib/video';

const VIDEO_SOURCES = [
  { value: 'none', label: 'No Video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'bunny', label: 'Bunny CDN' },
  { value: 's3', label: 'AWS S3' },
  { value: 'direct', label: 'Direct Upload' },
];

export function LectureVideoPanel({ videoSource, onChange }: { videoSource: VideoSource; onChange: (v: VideoSource) => void }) {
  const set = (patch: Partial<VideoSource>) => onChange({ ...videoSource, ...patch });

  const isYouTube = videoSource?.source === 'youtube';

  const handleYouTubeLink = (raw: string) => {
    const id = extractYouTubeId(raw);
    if (id) {
      onChange({
        ...videoSource,
        source: 'youtube',
        videoId: id,
        url: '',
        thumbnailUrl: buildYouTubeThumbnailUrl(id),
      });
    } else {
      onChange({ ...videoSource, source: 'youtube', videoId: raw, url: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="video-source" className="text-sm font-medium">Source</label>
          <select
            id="video-source"
            value={videoSource?.source || 'none'}
            onChange={(e) => set({ source: e.target.value as VideoSource['source'], url: '', videoId: '', thumbnailUrl: '' })}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {VIDEO_SOURCES.map((vs) => <option key={vs.value} value={vs.value}>{vs.label}</option>)}
          </select>
        </div>
        {isYouTube && (
          <div className="space-y-2">
            <label htmlFor="video-url" className="text-sm font-medium">YouTube Link</label>
            <Input
              id="video-id"
              value={videoSource?.videoId || ''}
              onChange={(e) => handleYouTubeLink(e.target.value)}
              placeholder="Paste YouTube link (watch / youtu.be / shorts / embed)"
            />
            <p className="text-xs text-muted-foreground">
              {videoSource?.videoId
                ? (extractYouTubeId(videoSource.videoId)
                    ? `Video ID: ${extractYouTubeId(videoSource.videoId)}`
                    : 'Waiting for a valid YouTube link or video ID…')
                : 'Paste a link above — the video ID and thumbnail are created automatically.'}
            </p>
          </div>
        )}
        {videoSource?.source === 'vimeo' && (
          <div className="space-y-2">
            <label htmlFor="video-id" className="text-sm font-medium">Video ID</label>
            <Input
              id="video-id"
              value={videoSource?.videoId || ''}
              onChange={(e) => set({ videoId: e.target.value })}
              placeholder="e.g. 123456789"
            />
          </div>
        )}
        {(videoSource?.source === 'direct' || videoSource?.source === 'bunny') && (
          <div className="space-y-2">
            <label htmlFor="video-url" className="text-sm font-medium">Video URL</label>
            <Input
              id="video-url"
              value={videoSource?.url || ''}
              onChange={(e) => set({ url: e.target.value })}
              placeholder="https://…"
            />
          </div>
        )}
        {videoSource?.source === 's3' && (
          <div className="space-y-2">
            <label htmlFor="s3-key" className="text-sm font-medium">S3 Object Key</label>
            <Input
              id="s3-key"
              value={videoSource?.videoId || ''}
              onChange={(e) => set({ videoId: e.target.value })}
            />
          </div>
        )}
      </div>

      {isYouTube && extractYouTubeId(videoSource?.videoId) && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <img
            src={buildYouTubeThumbnailUrl(extractYouTubeId(videoSource.videoId) || '')}
            onError={(e) => {
              const fallback = youtubeThumbnailFallback((e.currentTarget as HTMLImageElement).src);
              if (fallback && (e.currentTarget as HTMLImageElement).src !== fallback) {
                (e.currentTarget as HTMLImageElement).src = fallback;
              }
            }}
            alt="Generated thumbnail"
            className="h-16 w-28 rounded object-cover"
          />
          <div>
            <p className="text-sm font-medium">Thumbnail generated automatically</p>
            <p className="text-xs text-muted-foreground">There is no need to enter a thumbnail URL for YouTube.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Video</label>
        <FileUploader
          accept=".mp4,.webm,.mov,.mkv"
          maxSize={200 * 1024 * 1024}
          label="Upload video file"
          hint="MP4, WebM, MOV or MKV up to 200MB"
          value={videoSource?.url ? { url: videoSource.url, publicId: videoSource.videoId, name: videoSource.videoId || 'Uploaded video' } : null}
          onChange={(r) => r ? set({ source: 'direct', url: r.url, videoId: r.publicId }) : set({ url: '', videoId: '' })}
          upload={uploadApi.video}
        />
      </div>

      {videoSource?.source !== 'none' && !isYouTube && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="thumbnail-url" className="text-sm font-medium">Thumbnail URL</label>
            <Input
              id="thumbnail-url"
              value={videoSource?.thumbnailUrl || ''}
              onChange={(e) => set({ thumbnailUrl: e.target.value })}
              placeholder="https://…/thumbnail.jpg"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="playback-rate" className="text-sm font-medium">Playback Rate</label>
            <Input
              id="playback-rate"
              type="number"
              step="0.25"
              value={videoSource?.playbackRate || 1}
              onChange={(e) => set({ playbackRate: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {isYouTube && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div />
          <div className="space-y-2">
            <label htmlFor="playback-rate" className="text-sm font-medium">Playback Rate</label>
            <Input
              id="playback-rate"
              type="number"
              step="0.25"
              value={videoSource?.playbackRate || 1}
              onChange={(e) => set({ playbackRate: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
