import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

const prefersReducedMotion =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

const pageVariants = {
  initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -20 },
};

const pageTransition = prefersReducedMotion
  ? { duration: 0 }
  : {
      type: 'tween' as const,
      ease: 'anticipate' as const,
      duration: 0.3,
    };

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={window.location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function StaggerContainer({ children, delay = 0.1 }: { children: ReactNode; delay?: number }) {
  if (prefersReducedMotion) return <>{children}</>;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  if (prefersReducedMotion) return <>{children}</>;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: 'easeOut', delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
