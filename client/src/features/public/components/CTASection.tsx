import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  title: string;
  description?: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  background?: 'brand' | 'muted' | 'gradient' | 'navy';
  className?: string;
}

const bgMap = {
  brand: 'bg-primary text-white',
  muted: 'bg-muted/50 text-foreground',
  gradient: 'bg-gradient-to-br from-primary/10 via-background to-background text-foreground',
  navy: 'bg-gray-900 text-primary-foreground/90',
};

export function CTASection({ title, description, primaryAction, secondaryAction, background = 'brand', className }: CTASectionProps) {
  const isDark = background === 'brand' || background === 'navy';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn('rounded-2xl px-8 sm:px-12 lg:px-16 py-12 sm:py-16 text-center', bgMap[background], className)}
    >
      <h2 className={cn('text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight', isDark ? 'text-white' : 'text-foreground')}>
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed', isDark ? 'text-white/80' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <Button asChild size="lg" className={cn(
          'rounded-full px-8 h-12 text-base font-semibold',
          isDark
            ? 'bg-background text-foreground hover:bg-muted'
            : 'bg-primary text-white hover:bg-primary-700 shadow-md shadow-primary/30'
        )}>
          <Link to={primaryAction.href}>
            {primaryAction.label} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        {secondaryAction && (
          <Button asChild variant="outline" size="lg" className={cn(
            'rounded-full px-8 h-12 text-base font-medium',
            isDark ? 'border-white/30 text-white hover:bg-background/10' : 'border-border text-foreground/80'
          )}>
            <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
        )}
      </div>
    </motion.section>
  );
}
