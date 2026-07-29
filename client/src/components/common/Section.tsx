import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'primary' | 'gradient';
  id?: string;
}

export function Section({
  children,
  className,
  size = 'md',
  background = 'default',
  id,
}: SectionProps) {
  const sizeClasses = {
    sm: 'py-12 sm:py-16 lg:py-20',
    md: 'py-16 sm:py-24 lg:py-32',
    lg: 'py-24 sm:py-32 lg:py-40',
    xl: 'py-32 sm:py-40 lg:py-48',
  };

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    primary: 'bg-primary text-primary-foreground',
    gradient: 'bg-gradient-to-b from-background via-muted/50 to-background',
  };

  return (
    <section
      id={id}
      className={cn(
        'w-full',
        sizeClasses[size],
        backgroundClasses[background],
        className
      )}
    >
      <div className="container-custom">{children}</div>
    </section>
  );
}

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
    full: 'max-w-full',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  );
}