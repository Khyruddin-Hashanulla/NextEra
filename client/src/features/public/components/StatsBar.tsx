import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Stat {
  icon?: ReactNode;
  value: number;
  suffix?: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
  className?: string;
  columns?: 2 | 3 | 4;
}

export function StatsBar({ stats, className, columns = 4 }: StatsBarProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className={cn('grid grid-cols-2 gap-6 sm:gap-8', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="text-center"
        >
          {stat.icon && (
            <div className="flex items-center justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {stat.icon}
              </div>
            </div>
          )}
          <motion.p
            className="text-3xl sm:text-4xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            {formatNumber(stat.value)}{stat.suffix || ''}
          </motion.p>
          <p className="text-sm mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
