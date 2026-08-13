import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Star, MessageSquareText, TrendingUp } from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import type { InstructorProfile } from './types';

interface InstructorStatsProps {
  instructor: InstructorProfile;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

export const InstructorStats = memo(function InstructorStats({ instructor }: InstructorStatsProps) {
  const satisfaction = instructor.averageRating > 0 ? Math.round((instructor.averageRating / 5) * 100) : 0;

  const stats = [
    {
      icon: BookOpen,
      label: 'Courses',
      value: formatNumber(instructor.totalCourses),
      accent: 'from-primary/20 to-primary/5 text-primary',
    },
    {
      icon: Users,
      label: 'Students',
      value: formatNumber(instructor.totalStudents),
      accent: 'from-aura-primary/20 to-aura-primary/5 text-aura-primary',
    },
    {
      icon: MessageSquareText,
      label: 'Reviews',
      value: formatNumber(instructor.totalReviews),
      accent: 'from-emerald-500/15 to-emerald-500/5 text-emerald-500',
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: instructor.averageRating ? instructor.averageRating.toFixed(1) : 'New',
      accent: 'from-amber-500/15 to-amber-500/5 text-amber-500',
    },
    ...(satisfaction > 0
      ? [
          {
            icon: TrendingUp,
            label: 'Learner Satisfaction',
            value: `${satisfaction}%`,
            accent: 'from-sky-500/15 to-sky-500/5 text-sky-500',
          },
        ]
      : []),
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5"
    >
      {stats.map(({ icon: Icon, label, value, accent }) => (
        <motion.div
          key={label}
          variants={itemVariants}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5"
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-80',
              accent
            )}
            aria-hidden="true"
          />
          <div className="relative">
            <Icon className={cn('h-5 w-5', accent)} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});
