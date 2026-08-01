import { AxiosError } from 'axios';

export type ErrorCategory = 'network' | 'not-found' | 'forbidden' | 'server' | 'unknown';

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof AxiosError) {
    if (!error.response) return 'network';
    if (error.response.status === 404) return 'not-found';
    if (error.response.status === 403) return 'forbidden';
    if (error.response.status >= 500) return 'server';
  }
  return 'unknown';
}
