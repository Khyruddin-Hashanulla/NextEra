import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageBackground, PageBackgroundVariant } from './PageBackground';

interface PageContainerProps {
  children: ReactNode;
  variant?: PageBackgroundVariant;
  className?: string;
}

export function PageContainer({ children, variant = 'subtle', className }: PageContainerProps) {
  return (
    <div className={cn('relative isolate overflow-x-clip', className)}>
      <PageBackground variant={variant} className="absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
