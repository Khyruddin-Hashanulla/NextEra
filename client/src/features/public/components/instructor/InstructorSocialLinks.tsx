import { memo } from 'react';
import { Linkedin, Twitter, Github, Globe, Code2, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InstructorProfile } from './types';

const LINK_ICONS = {
  linkedin: Linkedin,
  twitter: Twitter,
  github: Github,
  portfolio: Code2,
  website: Globe,
  youtube: Youtube,
} as const;

const LINK_LABELS: Record<keyof typeof LINK_ICONS, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  github: 'GitHub',
  portfolio: 'Portfolio',
  website: 'Website',
  youtube: 'YouTube',
};

interface InstructorSocialLinksProps {
  links?: Partial<InstructorProfile['socialLinks']>;
  size?: 'sm' | 'md';
  className?: string;
}

/** Renders icon buttons for every social URL the instructor actually has. */
export const InstructorSocialLinks = memo(function InstructorSocialLinks({
  links,
  size = 'md',
  className,
}: InstructorSocialLinksProps) {
  const entries = (Object.keys(LINK_ICONS) as Array<keyof typeof LINK_ICONS>)
    .filter((key) => Boolean(links?.[key]))
    .map((key) => ({ key, url: links![key]!, Icon: LINK_ICONS[key] }));

  if (entries.length === 0) return null;

  const sizeClasses = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {entries.map(({ key, url, Icon }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LINK_LABELS[key]}
          title={LINK_LABELS[key]}
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            sizeClasses
          )}
        >
          <Icon className={iconSize} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
});
