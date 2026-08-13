export const SEO_DEFAULTS = {
  SITE_NAME: 'NextEra',
  SITE_URL: import.meta.env.VITE_SITE_URL || 'https://nextera.com',
  DEFAULT_DESCRIPTION:
    'NextEra is a modern learning management system offering high-quality courses in web development, programming, and technology skills.',
  DEFAULT_IMAGE: '/favicon.svg',
  DEFAULT_TITLE: 'NextEra - Learn to Code',
  TWITTER_HANDLE: '@nextera',
} as const;

export function buildCanonical(path: string): string {
  const base = SEO_DEFAULTS.SITE_URL.replace(/\/+$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

export function formatPageTitle(title: string): string {
  if (title.includes('NextEra')) return title;
  return `${title} | ${SEO_DEFAULTS.SITE_NAME}`;
}
