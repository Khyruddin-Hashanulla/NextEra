import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompanyLogoSectionProps {
  companies?: string[];
  className?: string;
}

export const DEFAULT_COMPANIES = [
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'Netflix',
  'Adobe',
  'Spotify',
  'Figma',
  'Slack',
  'Notion',
];

export function CompanyLogoSection({ companies = DEFAULT_COMPANIES, className }: CompanyLogoSectionProps) {
  const marqueeItems = useMemo(() => [...companies, ...companies], [companies]);

  return (
    <section
      aria-label="Trusted by learners from leading companies"
      className={cn('border-y border-border bg-muted/40 py-12 sm:py-14', className)}
    >
      <div className="container-custom">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Trusted by learners from
        </motion.p>

        <div
          className="group relative flex overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          }}
        >
          <div className="animate-marquee flex w-max items-center gap-16 pr-16 group-hover:[animation-play-state:paused]">
            {marqueeItems.map((company, index) => {
              const isDuplicate = index >= companies.length;
              return (
                <span
                  key={`${company}-${index}`}
                  aria-hidden={isDuplicate}
                  className="flex items-center gap-2 whitespace-nowrap font-display text-xl font-bold tracking-tight sm:text-2xl"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                  <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                    {company}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
