import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { Lecture } from '../src/models/lecture.model';

/**
 * YouTube ID extractor (mirrors client/src/lib/video.ts).
 * Accepts a bare 11-char ID or any YouTube URL shape (watch / youtu.be /
 * shorts / embed / v / live). Returns '' when nothing valid is found.
 */
const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/|attribution_link\?a=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractYouTubeId(value: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  return YOUTUBE_ID_RE.exec(v)?.[1] || '';
}

function buildYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * One-time backfill for YouTube lectures created with the legacy editor, which
 * accepted a raw "Video ID" that could be a full URL and left videoSource.url
 * populated. Normalizes so each YouTube lecture stores ONLY the 11-char videoId
 * and carries an auto-generated thumbnail. Idempotent and safe to re-run; the
 * student player already parses URLs, so this improves consistency without
 * breaking playback.
 */
async function main() {
  await mongoose.connect(env.mongodbUri);

  const lectures = await Lecture.find({ 'videoSource.source': 'youtube' });
  let updated = 0;

  for (const lecture of lectures) {
    const source = lecture.videoSource || {};
    const rawId = String(source.videoId || '') || String(source.url || '');
    const id = extractYouTubeId(rawId);

    if (!id) {
      logger.warn(`Skipping lecture ${lecture._id} "${lecture.title}": no valid YouTube ID found`);
      continue;
    }

    const thumbnailUrl = buildYouTubeThumbnailUrl(id);
    const needsUpdate =
      String(source.videoId || '') !== id ||
      String(source.url || '') !== '' ||
      String(source.thumbnailUrl || '') !== thumbnailUrl;

    if (!needsUpdate) continue;

    lecture.videoSource = {
      ...source,
      source: 'youtube',
      videoId: id,
      url: '',
      provider: String(source.provider || ''),
      thumbnailUrl,
      playbackRate: Number(source.playbackRate) || 1,
      qualities: Array.isArray(source.qualities) ? source.qualities : [],
    };

    await (lecture as any).save();
    updated += 1;
    logger.info(`Normalized YouTube lecture ${lecture._id} -> ${id}`);
  }

  logger.info(`Backfilled ${updated} YouTube lecture(s)`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  logger.error('YouTube backfill failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
