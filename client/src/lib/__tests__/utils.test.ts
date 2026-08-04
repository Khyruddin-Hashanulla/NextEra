import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cn,
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  slugify,
  truncate,
  getInitials,
  debounce,
  throttle,
  generateId,
  classNames,
  sleep,
  isValidUrl,
  getErrorMessage,
} from '@/lib/utils';

describe('cn', () => {
  it('merges conditional class names', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  it('drops conflicting tailwind classes using tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatCurrency', () => {
  it('formats INR amounts with no decimals by default', () => {
    expect(formatCurrency(1999)).toMatch(/1,999/);
  });

  it('respects custom currency and locale', () => {
    expect(formatCurrency(99, 'USD', 'en-US')).toContain('$99');
  });
});

describe('formatNumber', () => {
  it('returns the number as-is below 1k', () => {
    expect(formatNumber(500)).toBe('500');
  });

  it('formats thousands with K', () => {
    expect(formatNumber(1500)).toBe('1.5K');
  });

  it('formats millions with M', () => {
    expect(formatNumber(1200000)).toBe('1.2M');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    expect(formatDate('2026-07-01T00:00:00.000Z')).toMatch(/Jul 1, 2026/);
  });

  it('supports custom options', () => {
    expect(formatDate(new Date('2026-07-01'), { year: 'numeric' })).toMatch(/2026/);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for recent timestamps', () => {
    expect(formatRelativeTime('2026-07-10T11:59:30.000Z')).toBe('just now');
  });

  it('returns minutes', () => {
    expect(formatRelativeTime('2026-07-10T11:55:00.000Z')).toBe('5m ago');
  });

  it('returns hours', () => {
    expect(formatRelativeTime('2026-07-10T09:00:00.000Z')).toBe('3h ago');
  });

  it('returns days', () => {
    expect(formatRelativeTime('2026-07-06T12:00:00.000Z')).toBe('4d ago');
  });

  it('falls back to formatted date after a week', () => {
    expect(formatRelativeTime('2026-06-01T00:00:00.000Z')).toMatch(/Jun 1, 2026/);
  });
});

describe('slugify', () => {
  it('lowercases and trims', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('collapses separators and trims dashes', () => {
    expect(slugify('---React -- Hooks---')).toBe('react-hooks');
  });
});

describe('truncate', () => {
  it('returns text unchanged when within length', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates longer text with an ellipsis', () => {
    expect(truncate('a very long sentence here', 10)).toBe('a very lon...');
  });
});

describe('getInitials', () => {
  it('builds up to two initials', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('uppercases and handles a single name', () => {
    expect(getInitials('ada')).toBe('A');
  });
});

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('delays invocation until quiet period', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(50);
    debounced('c');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });
});

describe('throttle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('invokes immediately then at most once per limit', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('generateId', () => {
  it('generates an id with the prefix', () => {
    expect(generateId('note-')).toMatch(/^note-/);
  });

  it('generates a random alphanumeric id without prefix', () => {
    expect(generateId()).toMatch(/^[a-z0-9]{7}$/);
  });
});

describe('classNames', () => {
  it('joins truthy values', () => {
    expect(classNames('a', true && 'b', false && 'c', null, undefined)).toBe('a b');
  });
});

describe('sleep', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves after the given ms', async () => {
    const promise = sleep(50);
    vi.advanceTimersByTime(50);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('isValidUrl', () => {
  it('accepts valid urls', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true);
  });

  it('rejects invalid urls', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('extracts Error messages', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns strings verbatim', () => {
    expect(getErrorMessage('custom')).toBe('custom');
  });

  it('returns a fallback for unknown values', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
  });
});
