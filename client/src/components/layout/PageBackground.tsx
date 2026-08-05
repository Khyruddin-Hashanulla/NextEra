import { cn } from '@/lib/utils';

export type PageBackgroundVariant = 'hero' | 'auth' | 'dashboard' | 'subtle';

interface PageBackgroundProps {
  variant?: PageBackgroundVariant;
  className?: string;
}

const config: Record<
  PageBackgroundVariant,
  { wash: string; grid: string; orbs: [string, string] }
> = {
  hero: {
    wash: 'bg-gradient-to-br from-primary/[0.07] via-background to-background',
    grid: 'opacity-[0.4] dark:opacity-[0.25]',
    orbs: [
      'absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-primary/10 blur-3xl',
      'absolute bottom-0 left-[-5%] h-80 w-80 rounded-full bg-aura-secondary/10 blur-3xl',
    ],
  },
  subtle: {
    wash: 'bg-gradient-to-b from-background via-muted/30 to-background',
    grid: 'opacity-30 dark:opacity-20',
    orbs: [
      'absolute -top-40 right-[-12%] h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl',
      'absolute bottom-[-6rem] left-[-8%] h-80 w-80 rounded-full bg-aura-secondary/[0.06] blur-3xl',
    ],
  },
  auth: {
    wash: 'bg-gradient-to-b from-background via-muted/30 to-background',
    grid: 'hidden',
    orbs: [
      'absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl',
      'absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-aura-secondary/5 blur-3xl',
    ],
  },
  dashboard: {
    wash: 'bg-gradient-to-b from-primary/[0.04] via-background to-background',
    grid: 'hidden',
    orbs: [
      'absolute -top-32 right-[5%] h-80 w-80 rounded-full bg-primary/[0.05] blur-3xl',
      'absolute bottom-[-4rem] left-[10%] h-72 w-72 rounded-full bg-aura-secondary/[0.05] blur-3xl',
    ],
  },
};

export function PageBackground({ variant = 'subtle', className }: PageBackgroundProps) {
  const { wash, grid, orbs } = config[variant];
  return (
    <div className={cn('pointer-events-none overflow-hidden', className)} aria-hidden="true">
      <div className={cn('absolute inset-0', wash)} />
      <div className={cn('absolute inset-0 bg-grid-pattern', grid)} />
      <div className={orbs[0]} />
      <div className={orbs[1]} />
    </div>
  );
}
