import { motion } from 'framer-motion';
import { BookOpen, Users, GraduationCap, Star } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { AnimatedNumber } from './AnimatedNumber';
import type { HomeStats } from './useHomePageData';

interface LearningStatsProps {
  stats: HomeStats;
  isLoading: boolean;
}

interface StatItem {
  icon: typeof BookOpen;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
}

export function LearningStats({ stats, isLoading }: LearningStatsProps) {
  const statItems: StatItem[] = [
    { icon: Users, label: 'Students learning', value: stats.students, accent: 'bg-primary/10 text-primary' },
    { icon: BookOpen, label: 'Courses published', value: stats.courses, accent: 'bg-sky-500/10 text-sky-500' },
    { icon: GraduationCap, label: 'Expert instructors', value: stats.instructors, accent: 'bg-amber-500/10 text-amber-500' },
    { icon: Star, label: 'Average course rating', value: stats.averageRating, suffix: '/5', accent: 'bg-violet-500/10 text-violet-500' },
  ];

  return (
    <section id="stats" className="border-y border-border bg-muted/40 py-16 sm:py-20">
      <div className="container-custom">
        <SectionHeading
          eyebrow="Platform numbers"
          title="A learning platform you can trust"
          subtitle="Real progress, measured in the thousands — here's where the NextEra community stands today."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statItems.map((stat) => (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.accent}`}>
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground sm:text-3xl">
                  {isLoading ? (
                    <span className="text-muted-foreground/40">—</span>
                  ) : (
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
