import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Code2,
  Maximize2,
  MonitorPlay,
  Play,
  TrendingUp,
  Users2,
  Video,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: BookOpen,
    title: 'Learn from structured courses',
    description:
      'Follow well-organized modules with video lectures, practice materials, and resources that build real skills step by step.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: Code2,
    title: 'Learn by building & practicing',
    description:
      'Quizzes, assignments, coding problems, and notes help you apply every concept and track your progress as you go.',
    accent: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    icon: Award,
    title: 'Track, complete & prove your skills',
    description:
      'Earn shareable certificates for completed courses and verify your achievements with anyone, anytime.',
    accent: 'bg-amber-500/10 text-amber-500',
  },
  {
    icon: Users2,
    title: 'Learn with real instructors',
    description:
      'Take instructor-led courses, join live classes, and get announcements and direct guidance from experts.',
    accent: 'bg-violet-500/10 text-violet-500',
  },
];

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

function LearningComposition() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="img"
      aria-label="The NextEra learning experience — video courses, live classes, coding practice, progress tracking and verified certificates."
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
    >
      {/* Decorative glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-8 z-0">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-6 top-0 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-6 h-52 w-52 rounded-full bg-aura-secondary/15 blur-3xl" />
      </div>

      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        whileInView={reduceMotion ? undefined : 'show'}
        viewport={{ once: true, margin: '-80px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5"
      >
        {/* Live class */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <Video className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              Live class
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Today · 7:00 PM</p>
          </div>
        </motion.div>

        {/* Course progress */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">82%</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Course progress</p>
          </div>
        </motion.div>

        {/* Dominant course-player card */}
        <motion.div variants={itemVariants} className="sm:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/10">
            <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-2">
                <MonitorPlay className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                  Data Structures &amp; Algorithms
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                Week 3 · Recursion
              </span>
            </div>

            <div className="relative aspect-video bg-gradient-to-br from-primary/25 via-primary/5 to-cyan-400/15">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 sm:h-16 sm:w-16">
                  <Play className="h-6 w-6 fill-current" aria-hidden="true" />
                </div>
              </div>
              <div className="absolute bottom-12 right-3 flex items-center gap-2 text-white/90">
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-white/30">
                  <div className="h-full w-2/3 rounded-full bg-white/80" />
                </div>
                <span className="text-[10px] font-medium text-white">14:32 / 21:40</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Users2 className="h-3.5 w-3.5" aria-hidden="true" />
                2,148 watching
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  72% complete
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Certificate */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Award className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Certificate earned</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" aria-hidden="true" /> Verified
            </p>
          </div>
        </motion.div>

        {/* Coding practice */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <Code2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">24 problems</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Coding practice</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function WhyChooseUs() {
  return (
    <section id="why-us" className="pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
      <div className="container-custom">
        <SectionHeading
          eyebrow="Why NextEra"
          title="Everything you need to learn, build & grow"
          subtitle="One platform for your entire learning journey — from your very first lesson to a verified certificate."
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-stretch lg:gap-16">
          <LearningComposition />

          <div className="flex flex-col lg:justify-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className="space-y-8"
            >
              {FEATURES.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group flex items-start gap-4"
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                      feature.accent
                    )}
                  >
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
