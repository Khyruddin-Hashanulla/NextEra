import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstructorAboutProps {
  name: string;
  bio?: string;
}

const COLLAPSED_HEIGHT = 104;

export function InstructorAbout({ name, bio }: InstructorAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState(COLLAPSED_HEIGHT);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > COLLAPSED_HEIGHT);
  }, [bio]);

  if (!bio) return null;

  const toggle = () => {
    const el = contentRef.current;
    if (!el) return;
    if (expanded) {
      setExpanded(false);
      setMaxHeight(COLLAPSED_HEIGHT);
    } else {
      setExpanded(true);
      setMaxHeight(el.scrollHeight);
    }
  };

  return (
    <div id="about" className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
        </span>
        About {name}
      </h2>

      <motion.div
        initial={{ maxHeight: COLLAPSED_HEIGHT }}
        animate={{ maxHeight }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className={cn('overflow-hidden', !expanded && '[mask-image:linear-gradient(to_bottom,black_70%,transparent)]')}
      >
        <div ref={contentRef} className="text-base leading-relaxed text-muted-foreground">
          {bio}
        </div>
      </motion.div>

      {isClamped && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="mt-3 rounded-md text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
