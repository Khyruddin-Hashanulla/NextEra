import { describe, expect, it } from 'vitest';
import { SEO_DEFAULTS, buildCanonical, formatPageTitle } from '@/lib/seo';

describe('seo helpers', () => {
  it('exposes defaults', () => {
    expect(SEO_DEFAULTS.SITE_NAME).toBe('NextEra');
    expect(SEO_DEFAULTS.DEFAULT_TITLE).toContain('NextEra');
  });

  it('builds a canonical url from a path', () => {
    expect(buildCanonical('/courses')).toBe(`${SEO_DEFAULTS.SITE_URL.replace(/\/+$/, '')}/courses`);
    expect(buildCanonical('courses')).toBe(`${SEO_DEFAULTS.SITE_URL.replace(/\/+$/, '')}/courses`);
  });

  it('formats a page title with the site name', () => {
    expect(formatPageTitle('Courses')).toBe('Courses | NextEra');
  });

  it('does not duplicate the site name', () => {
    expect(formatPageTitle('NextEra - Learn to Code')).toBe('NextEra - Learn to Code');
  });
});
