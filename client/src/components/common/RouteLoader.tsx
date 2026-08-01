import { LoadingSpinner } from './LoadingSpinner';

export function RouteLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <LoadingSpinner size="lg" />
      <span className="sr-only">Loading page...</span>
    </div>
  );
}
