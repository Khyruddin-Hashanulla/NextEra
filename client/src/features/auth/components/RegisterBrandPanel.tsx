import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Video, Code2, Award, type LucideIcon } from 'lucide-react';

const easeOut = [0.22, 1, 0.36, 1] as const;

const founder = {
  name: 'Khyruddin Hashanulla',
  role: 'Software Engineer · Founder of NextEra',
  image: '/images/Khyruddin_Hashanulla.PNG',
  alt: 'Khyruddin Hashanulla, Founder of NextEra',
  width: 1122,
  height: 1402,
};

const highlights: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BookOpen,
    title: 'Structured courses',
    description: 'Project-based lessons across web development and programming.',
  },
  {
    icon: Video,
    title: 'Live classes',
    description: 'Learn together in real time with interactive sessions.',
  },
  {
    icon: Code2,
    title: 'Coding practice',
    description: 'Hands-on challenges that build real, job-ready skills.',
  },
  {
    icon: Award,
    title: 'Certificates',
    description: 'Earn shareable certificates as you complete milestones.',
  },
];

export function RegisterBrandPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: easeOut, delay: 0.15 }}
      className="hidden lg:block"
      aria-label="About NextEra"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border bg-card/60 shadow-2xl shadow-primary/10">
        <div className="relative min-h-0 flex-1">
          <img
            src={founder.image}
            alt={founder.alt}
            width={founder.width}
            height={founder.height}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Founder</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
              {founder.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{founder.role}</p>
            <blockquote className="mt-4 max-w-md border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-muted-foreground">
              NextEra is built for learners who want to master development through real projects,
              live mentorship, and a community that grows with you.
            </blockquote>
          </div>
        </div>

        <div className="border-t bg-card/40 p-6 sm:p-8">
          <ul className="grid grid-cols-2 gap-4">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card/70 text-primary shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.aside>
  );
}