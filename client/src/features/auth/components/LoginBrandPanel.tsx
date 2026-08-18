import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { BookOpen, Video, Code2, Award, type LucideIcon } from 'lucide-react';

const easeOut = [0.22, 1, 0.36, 1] as const;

const features: { icon: LucideIcon; title: string; description: string }[] = [
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

export function LoginBrandPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: easeOut, delay: 0.15 }}
      className="hidden lg:block"
      aria-label="About NextEra"
    >
      <div className="flex h-full flex-col rounded-3xl border bg-card/60 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <img
            src="/images/NextEra.png"
            alt=""
            className="h-12 w-12 rounded-xl object-cover shadow-lg shadow-primary/25"
          />
          <span className="text-3xl font-bold tracking-tight">NextEra</span>
        </Link>

        <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-foreground">
          Welcome back to your learning journey
        </h2>
        <p className="mt-3 text-muted-foreground">
          Sign in to pick up where you left off — courses, live classes, coding practice, and
          certificates in one place.
        </p>

        <ul className="mt-8 space-y-4">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card/70 text-primary shadow-sm">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  );
}