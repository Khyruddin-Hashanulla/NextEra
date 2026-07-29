import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/common/PageTransition';
import { ROUTES } from '@/lib/constants';

export function NotFoundPage() {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4 py-16">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl sm:text-9xl font-bold text-primary mb-6"
          >
            404
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Page Not Found
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to={ROUTES.HOME}>Go Home</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link to={ROUTES.COURSES}>Browse Courses</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm"
          >
            <button
              onClick={() => window.history.back()}
              className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Back to previous page
            </button>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <Link
              to={ROUTES.CONTACT}
              className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Contact Support
            </Link>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
