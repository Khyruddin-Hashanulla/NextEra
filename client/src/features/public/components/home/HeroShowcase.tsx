import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Award, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HERO_TOPICS, type HeroTopic } from './topicData';
import { HeroTopicCard } from './HeroTopicCard';

const AUTO_ROTATE_MS = 4000;

const easeOut = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 64, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -64, scale: 0.97 }),
};

interface HeroShowcaseProps {
  topics?: HeroTopic[];
  className?: string;
}

function FloatingChip({
  className,
  icon: Icon,
  label,
  value,
  reducedMotion,
  delay = 0,
}: {
  className?: string;
  icon: typeof Star;
  label: string;
  value: string;
  reducedMotion: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: reducedMotion ? 0 : [0, -8, 0] }}
      transition={{ delay, duration: reducedMotion ? 0.4 : 5, repeat: reducedMotion ? 0 : Infinity, ease: 'easeInOut' }}
      className={cn(
        'absolute z-10 rounded-2xl border border-border bg-card/90 p-3.5 shadow-xl shadow-black/5 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroShowcase({ topics = HERO_TOPICS, className }: HeroShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: '-60px' });

  const reducedMotion = useMemo(() => {
    if (typeof window.matchMedia !== 'function') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((current) => (current + 1) % topics.length);
  }, [topics.length]);

  const _goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((current) => (current - 1 + topics.length) % topics.length);
  }, [topics.length]);

  const goTo = useCallback(
    (target: number) => {
      setDirection(target > index ? 1 : -1);
      setIndex(target);
    },
    [index]
  );

  useEffect(() => {
    if (!inView || paused || reducedMotion || topics.length < 2) return;
    const id = setInterval(goNext, AUTO_ROTATE_MS);
    return () => clearInterval(id);
  }, [inView, paused, reducedMotion, topics.length, goNext]);

  const activeTopic = topics[index];
  const autoActive = Boolean(inView) && !paused && !reducedMotion && topics.length > 1;

  return (
    <div className={cn('relative mx-auto w-full max-w-lg lg:max-w-none', className)}>
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-violet-500/20 blur-2xl"
          aria-hidden="true"
        />

        <div
          ref={containerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative"
        >
          <div className="relative h-[400px] overflow-hidden rounded-3xl border border-border bg-card/60 p-2 sm:h-[420px] sm:p-2.5">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={activeTopic.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: easeOut }}
                className="absolute inset-0"
              >
                <HeroTopicCard topic={activeTopic} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            {autoActive && (
              <motion.div
                key={activeTopic.id}
                initial={{ scaleX: 0 }}
                animate={paused ? { scaleX: 1 } : { scaleX: [0, 1] }}
                transition={{
                  duration: paused ? 0.2 : AUTO_ROTATE_MS / 1000,
                  ease: 'linear',
                }}
                style={{ originX: 0 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
              />
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {topics.map((topic, topicIndex) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => goTo(topicIndex)}
                aria-label={`Show ${topic.name} topic`}
                aria-current={topicIndex === index}
                className={cn(
                  'h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  topicIndex === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <FloatingChip
        icon={Star}
        value="4.9/5"
        label="Average rating"
        reducedMotion={reducedMotion}
        className="-right-2 top-8 sm:-right-6"
      />
      <FloatingChip
        icon={Users}
        value="50K+"
        label="Active learners"
        reducedMotion={reducedMotion}
        delay={0.6}
        className="-left-2 bottom-24 sm:-left-6"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: reducedMotion ? 0 : [0, -6, 0] }}
        transition={{
          delay: 1,
          duration: reducedMotion ? 0.4 : 5,
          repeat: reducedMotion ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-3 right-8 z-10 flex items-center gap-2 rounded-full border border-border bg-card/90 py-2 pl-2 pr-4 shadow-lg backdrop-blur-sm"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Award className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="text-xs font-semibold text-foreground">Earn certificates</span>
      </motion.div>
    </div>
  );
}
