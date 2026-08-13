import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: { label: string; href: string };
  color?: 'brand' | 'yellow' | 'blue' | 'pink' | 'orange' | 'purple';
  className?: string;
  highlighted?: boolean;
}

const colorMap = {
  brand: { bg: 'bg-primary/10', text: 'text-primary', card: 'border-primary/20' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', card: 'border-yellow-200/50' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', card: 'border-blue-200/50' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', card: 'border-pink-200/50' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', card: 'border-orange-200/50' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', card: 'border-purple-200/50' },
};

export function FeatureCard({
  icon,
  title,
  description,
  link,
  color = 'brand',
  className,
  highlighted,
}: FeatureCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        'group rounded-2xl bg-background p-6 sm:p-8 border transition-all duration-300',
        highlighted ? 'border-primary/30 shadow-md shadow-primary/10' : 'border-border shadow-sm hover:shadow-md',
        className
      )}
    >
      <div
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-colors',
          colors.bg,
          colors.text
        )}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
      {link && (
        <Link
          to={link.href}
          className={cn(
            'inline-flex items-center gap-1 text-sm font-medium transition-colors',
            colors.text,
            'hover:underline'
          )}
        >
          {link.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </motion.div>
  );
}
