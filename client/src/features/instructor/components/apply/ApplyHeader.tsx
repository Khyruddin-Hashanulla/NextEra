import { BadgeCheck, Clock3, ShieldCheck } from 'lucide-react';
import { PageBackground } from '@/components/layout/PageBackground';

const trustChips = [
  { icon: BadgeCheck, label: 'Free to apply' },
  { icon: Clock3, label: 'Reviewed within 5-7 days' },
  { icon: ShieldCheck, label: 'Secure & trusted' },
];

export function ApplyHeader() {
  return (
    <header className="relative overflow-hidden border-b bg-background">
      <PageBackground variant="hero" className="absolute inset-0 -z-10" />
      <div className="container-custom relative py-12 text-center sm:py-16 lg:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Instructor Application
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-display-xl font-display font-bold tracking-tight text-foreground text-balance">
          Become a{' '}
          <span className="bg-gradient-to-r from-primary to-aura-secondary bg-clip-text text-transparent">
            NextEra Instructor
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted-foreground text-balance">
          Share your expertise with learners worldwide. Build your audience, earn from every
          sale, and grow with a platform built for educators.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {trustChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              <chip.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
