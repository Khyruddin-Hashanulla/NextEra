import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { PageBackground } from '@/components/layout/PageBackground';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12 sm:py-16 lg:py-20">
      <PageBackground variant="auth" className="absolute inset-0 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn('relative w-full max-w-md', className)}
      >
        <Link
          to={ROUTES.HOME}
          className="mb-8 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <img
            src="/images/NextEra.png"
            alt="NextEra logo"
            className="h-10 w-10 rounded-md object-cover shadow-lg shadow-primary/25"
          />
          <span className="text-2xl font-bold tracking-tight">NextEra</span>
        </Link>

        <div className="rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">{children}</div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} NextEra. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
