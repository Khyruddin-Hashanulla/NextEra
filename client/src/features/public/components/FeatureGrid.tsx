import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: { label: string; href: string };
  color?: 'brand' | 'yellow' | 'blue' | 'pink' | 'orange' | 'purple';
}

interface FeatureGridProps {
  features: Feature[];
  className?: string;
  columns?: 2 | 3 | 4;
}

export function FeatureGrid({ features, className, columns = 3 }: FeatureGridProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:gap-8', gridCols[columns], className)}>
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <FeatureCard {...feature} highlighted={index === 0} />
        </motion.div>
      ))}
    </div>
  );
}
