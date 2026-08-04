import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { categorizeError } from '@/lib/error-utils';

describe('categorizeError', () => {
  it('categorizes network errors', () => {
    const error = new AxiosError('Network Error');
    expect(categorizeError(error)).toBe('network');
  });

  it('categorizes 404 as not-found', () => {
    const error = new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
      data: {},
      statusText: 'Not Found',
      headers: {},
      config: {} as any,
    });
    expect(categorizeError(error)).toBe('not-found');
  });

  it('categorizes 403 as forbidden', () => {
    const error = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 403,
      data: {},
      statusText: 'Forbidden',
      headers: {},
      config: {} as any,
    });
    expect(categorizeError(error)).toBe('forbidden');
  });

  it('categorizes 5xx as server', () => {
    const error = new AxiosError('Server', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 500,
      data: {},
      statusText: 'Server Error',
      headers: {},
      config: {} as any,
    });
    expect(categorizeError(error)).toBe('server');
  });

  it('returns unknown for other errors', () => {
    expect(categorizeError(new Error('boom'))).toBe('unknown');
    expect(categorizeError(null)).toBe('unknown');
    expect(categorizeError('x')).toBe('unknown');
  });
});
