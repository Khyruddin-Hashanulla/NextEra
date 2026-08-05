import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Sparkles, Users } from 'lucide-react';
import { formatCompactCount } from '@/features/public/components/home/AnimatedNumber';
import { HeroShowcase } from '@/features/public/components/home/HeroShowcase';
import type { HomeStats } from '@/features/public/components/home/useHomePageData';
import { PageBackground } from '@/components/layout/PageBackground';

interface HeroProps {
  className?: string;
  stats?: HomeStats;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Hero({ className, stats }: HeroProps) {
  const { isAuthenticated, user } = useAuth();

  const secondaryCta = isAuthenticated
    ? { label: 'Go to Dashboard', to: getDashboardRoute(user?.role) }
    : { label: 'Start Teaching', to: ROUTES.INSTRUCTOR_APPLY };

  const hasStats = Boolean(stats && stats.courses + stats.students + stats.instructors > 0);

  const heroStats = hasStats
    ? [
        { icon: BookOpen, label: 'Courses', value: stats!.courses },
        { icon: Users, label: 'Learners', value: stats!.students },
        { icon: GraduationCap, label: 'Instructors', value: stats!.instructors },
      ]
    : [];

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-background',
        className,
      )}
    >
      {/* Background layers */}
      <PageBackground variant="hero" className="absolute inset-0 -z-10" />

      <div className="container-custom relative z-10">
        <div className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Master in-demand skills with NextEra
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
              className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl font-display"
            >
              Learn from industry experts and{' '}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                build your career
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
            >
              Gain job-ready skills through expert-led courses, hands-on projects, and
              recognized certificates — at your own pace, on any device.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="h-12 w-full rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 sm:w-auto">
                <Link to={ROUTES.COURSES}>
                  Explore Courses <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full border-2 px-8 text-base font-semibold sm:w-auto"
              >
                <Link to={secondaryCta.to}>{secondaryCta.label}</Link>
              </Button>
            </motion.div>

            {heroStats.length > 0 && (
              <motion.dl
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: easeOut }}
                className="mt-10 grid grid-cols-3 gap-6 border-t border-border/70 pt-8"
              >
                {heroStats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground lg:justify-start">
                      <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      {formatCompactCount(stat.value)}+
                    </dd>
                    <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>

          {/* Learning topics showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: easeOut }}
          >
            <HeroShowcase />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
