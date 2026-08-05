import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Home, LayoutDashboard, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES, getDashboardRoute } from '@/lib/constants';
import { PageBackground } from '@/components/layout/PageBackground';

const statusConfig = {
  approved: {
    icon: CheckCircle2,
    iconClasses: 'bg-success/10 text-success',
    message: 'Congratulations! You are now an instructor.',
    accent: 'bg-success/10',
    bar: 'bg-success',
  },
  rejected: {
    icon: XCircle,
    iconClasses: 'bg-destructive/10 text-destructive',
    message: 'Your application was not approved. You can reapply.',
    accent: 'bg-destructive/10',
    bar: 'bg-destructive',
  },
  pending: {
    icon: Clock,
    iconClasses: 'bg-warning/10 text-warning',
    message: 'Your application is being reviewed.',
    accent: 'bg-warning/10',
    bar: 'bg-warning',
  },
} as const;

const timeline = [
  { label: 'Application received', state: 'done' },
  { label: 'Under review', state: 'active' },
  { label: 'Final decision', state: 'pending' },
] as const;

export function ApplicationStatusCard({ status }: { status?: string }) {
  const reduceMotion = useReducedMotion();
  const key = status === 'approved' || status === 'rejected' ? status : 'pending';
  const { icon: StatusIcon, iconClasses, message, accent, bar } = statusConfig[key];
  const isApproved = key === 'approved';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mx-auto w-full max-w-lg"
    >
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
        <PageBackground variant="auth" className="absolute inset-0 -z-10" />

        <div className="relative p-8 text-center sm:p-10">
          <div className="flex flex-col items-center">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconClasses}`}
            >
              <StatusIcon className="h-8 w-8" aria-hidden="true" />
            </motion.div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground capitalize">{key}</h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
          </div>

          {!isApproved && (
            <div className="mt-8 text-left">
              <div className={`mb-4 h-1.5 overflow-hidden rounded-full ${accent}`}>
                <div className={`h-full w-1/2 rounded-full ${bar}`} />
              </div>
              <ol className="space-y-3">
                {timeline.map((step) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        step.state === 'done'
                          ? 'bg-success'
                          : step.state === 'active'
                          ? 'bg-warning'
                          : 'bg-muted-foreground/30'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-muted-foreground">{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isApproved ? (
              <Button asChild className="h-12 w-full rounded-full px-7 sm:w-auto">
                <Link to={getDashboardRoute('instructor')}>
                  Go to Instructor Dashboard <LayoutDashboard className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="h-12 w-full rounded-full px-7 sm:w-auto">
                <Link to={ROUTES.HOME}>
                  Back to Home <Home className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" className="h-12 w-full rounded-full px-7 sm:w-auto">
              <Link to={ROUTES.COURSES}>
                Browse Courses <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
