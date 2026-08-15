import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Search, Sparkles, Users } from 'lucide-react';
import { formatCompactCount } from '@/features/public/components/home/AnimatedNumber';
import { HeroProfiles } from '@/features/public/components/home/HeroProfiles';
import type { HomeStats } from '@/features/public/components/home/useHomePageData';
import { PageBackground } from '@/components/layout/PageBackground';

interface HeroProps {
  className?: string;
  stats?: HomeStats;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Hero({ className, stats }: HeroProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.COURSES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className={cn('relative overflow-hidden bg-background', className)}>
      {/* Background layers */}
      <PageBackground variant="hero" className="absolute inset-0 -z-10" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 items-start gap-12 pb-16 pt-12 sm:pb-24 sm:pt-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 lg:pb-32 lg:pt-24">
          {/* Copy */}
          <div className="order-2 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              The learning platform for computer science
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
              className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:mx-0 lg:text-6xl"
            >
              <span className="block">Connecting</span>{' '}
              <span className="block">Students With</span>{' '}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                Tutors
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
            >
              Master computer science with hands-on courses, live classes, coding practice, and certificates you can
              verify — built to take you from learner to career-ready developer.
            </motion.p>

            {/* Course discovery search */}
            <motion.form
              role="search"
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: easeOut }}
              className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-full border border-border bg-background/70 p-2 shadow-lg shadow-primary/10 backdrop-blur-sm sm:rounded-full lg:mx-0"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  aria-label="Search courses"
                  placeholder="Search courses, topics, instructors…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full border-0 bg-transparent pl-11 pr-4 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-11 shrink-0 rounded-full px-5 text-sm font-semibold"
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34, ease: easeOut }}
              className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 sm:w-auto"
              >
                <Link to={ROUTES.COURSES}>
                  Explore Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
          </div>

          {/* Founders visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: easeOut }}
            className="order-1 mx-auto w-full max-w-xl lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center"
          >
            <HeroProfiles />
          </motion.div>

          {/* Statistics — left column bottom on desktop, after the visual on mobile */}
          {heroStats.length > 0 && (
            <motion.dl
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42, ease: easeOut }}
              className="order-3 mx-auto grid w-full max-w-md grid-cols-3 gap-6 border-t border-border/70 pt-8 sm:max-w-lg lg:col-start-1 lg:mx-0 lg:row-start-2 lg:max-w-none"
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
      </div>
    </section>
  );
}
