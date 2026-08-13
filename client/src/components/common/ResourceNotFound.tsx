import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { SEO } from '@/components/seo/SEO';
import { BookOpen, Search, Home, ArrowLeft, FileQuestion, User, Layers } from 'lucide-react';

type ResourceType = 'course' | 'blog' | 'instructor' | 'bundle' | 'lesson' | 'page' | 'resource';

interface ResourceNotFoundProps {
  resourceType?: ResourceType;
  title?: string;
  message?: string;
  seoTitle?: string;
  backLink?: { label: string; href: string };
  className?: string;
}

const resourceConfig: Record<
  ResourceType,
  { icon: typeof BookOpen; defaultTitle: string; defaultMessage: string; backLink: { label: string; href: string } }
> = {
  course: {
    icon: BookOpen,
    defaultTitle: 'Course Not Found',
    defaultMessage:
      "This course doesn't exist or has been removed. It may have been unpublished by the instructor or deleted.",
    backLink: { label: 'Browse Courses', href: ROUTES.COURSES },
  },
  blog: {
    icon: FileQuestion,
    defaultTitle: 'Article Not Found',
    defaultMessage: "This article doesn't exist or has been removed. It may have been deleted or the link is broken.",
    backLink: { label: 'Back to Blog', href: '/blog' },
  },
  instructor: {
    icon: User,
    defaultTitle: 'Instructor Not Found',
    defaultMessage:
      "This instructor profile doesn't exist or has been removed. They may no longer be teaching on our platform.",
    backLink: { label: 'Browse Instructors', href: '/instructors' },
  },
  bundle: {
    icon: Layers,
    defaultTitle: 'Bundle Not Found',
    defaultMessage: "This bundle doesn't exist or has been removed. It may have been unpublished or deleted.",
    backLink: { label: 'Browse Bundles', href: ROUTES.BUNDLES },
  },
  lesson: {
    icon: BookOpen,
    defaultTitle: 'Lesson Not Found',
    defaultMessage:
      "This lesson doesn't exist or has been removed. It may have been deleted or the course has been updated.",
    backLink: { label: 'Back to Courses', href: ROUTES.COURSES },
  },
  page: {
    icon: FileQuestion,
    defaultTitle: 'Page Not Found',
    defaultMessage: "The page you're looking for doesn't exist or has been moved.",
    backLink: { label: 'Go Home', href: ROUTES.HOME },
  },
  resource: {
    icon: Search,
    defaultTitle: 'Resource Not Found',
    defaultMessage: "The requested resource doesn't exist or has been removed.",
    backLink: { label: 'Go Home', href: ROUTES.HOME },
  },
};

export function ResourceNotFound({
  resourceType = 'resource',
  title,
  message,
  seoTitle,
  backLink,
  className,
}: ResourceNotFoundProps) {
  const config = resourceConfig[resourceType];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;
  const pageTitle = seoTitle || `${displayTitle} | NextEra LMS`;
  const link = backLink || config.backLink;

  return (
    <>
      <SEO title={pageTitle} description={displayMessage} robots="noindex,nofollow" />
      <div className={`flex min-h-[60vh] items-center justify-center px-4 py-16 ${className || ''}`}>
        <div className="mx-auto max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 0.15, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-8xl font-bold text-foreground select-none"
            aria-hidden="true"
          >
            404
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-foreground">{displayTitle}</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">{displayMessage}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to={link.href}>
                {link.label === 'Go Home' ? <Home className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {link.label}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to={ROUTES.HOME}>
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </motion.div>

          {resourceType !== 'page' && resourceType !== 'resource' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-6"
            >
              <button
                onClick={() => window.history.back()}
                className="text-sm text-muted-foreground/70 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                &larr; Go back
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
