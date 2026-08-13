export function formatLectureDuration(duration?: number): string {
  if (!duration || duration <= 0) return '';
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`.trim();
}

export function formatRecordedDuration(duration?: number): string {
  const secs = duration || 0;
  const mins = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${mins}:${seconds.toString().padStart(2, '0')}`;
}
