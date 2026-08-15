import { motion, useReducedMotion } from 'framer-motion';
import { Award, BookOpen, Code2, Video, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const easeOut = [0.22, 1, 0.36, 1] as const;

const founders = [
  {
    name: 'Khyruddin Hashanulla',
    role: 'Software Engineer · Founder of NextEra',
    image: '/images/Khyruddin_Hashanulla.PNG',
    alt: 'Khyruddin Hashanulla, Founder of NextEra',
    width: 1122,
    height: 1402,
  },
  {
    name: 'Shagaf Sayeka',
    role: 'Aspiring Data Scientist · Co-Founder of NextEra',
    image: '/images/Shagaf_Sayeka.JPG',
    alt: 'Shagaf Sayeka, Co-Founder of NextEra',
    width: 3088,
    height: 2316,
  },
] as const;

interface OrbitRing {
  className: string;
  duration: number;
  reverse: boolean;
  stroke: string;
  dash: string;
}

const orbitRings: OrbitRing[] = [
  {
    className:
      'h-[15.5rem] w-[15.5rem] sm:h-[21.75rem] sm:w-[21.75rem] md:h-[24.75rem] md:w-[24.75rem] lg:h-[26.25rem] lg:w-[26.25rem] xl:h-[33.5rem] xl:w-[33.5rem]',
    duration: 22,
    reverse: false,
    stroke: 'hsl(var(--primary) / 0.35)',
    dash: '1.6 2.6',
  },
  {
    className:
      'h-[17.25rem] w-[17.25rem] sm:h-[25rem] sm:w-[25rem] md:h-[28.25rem] md:w-[28.25rem] lg:h-[29.5rem] lg:w-[29.5rem] xl:h-[37.5rem] xl:w-[37.5rem]',
    duration: 32,
    reverse: true,
    stroke: '#22d3ee',
    dash: '0.6 3.4',
  },
  {
    className:
      'hidden sm:block h-[17.25rem] w-[17.25rem] sm:h-[28.75rem] sm:w-[28.75rem] md:h-[32.5rem] md:w-[32.5rem] lg:h-[32rem] lg:w-[32rem] xl:h-[41.5rem] xl:w-[41.5rem]',
    duration: 46,
    reverse: false,
    stroke: '#a78bfa',
    dash: '1.2 3',
  },
];

interface FeatureBadge {
  label: string;
  icon: LucideIcon;
  position: string;
  accent: 'purple' | 'cyan';
  pill: 'lg' | 'node';
}

const featureBadges: FeatureBadge[] = [
  {
    label: 'Courses',
    icon: BookOpen,
    position: 'top-2 right-2 sm:top-4 sm:right-6',
    accent: 'purple',
    pill: 'lg',
  },
  {
    label: 'Live Classes',
    icon: Video,
    position: 'hidden sm:flex bottom-2 left-0 sm:bottom-6 sm:left-6',
    accent: 'cyan',
    pill: 'lg',
  },
  {
    label: 'Coding Practice',
    icon: Code2,
    position: 'left-1 top-1/2 -translate-y-1/2 sm:left-2',
    accent: 'cyan',
    pill: 'node',
  },
  {
    label: 'Certificates',
    icon: Award,
    position: 'right-1 top-1/2 -translate-y-1/2 sm:right-2',
    accent: 'purple',
    pill: 'node',
  },
];

interface HeroProfilesProps {
  className?: string;
}

export function HeroProfiles({ className }: HeroProfilesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('relative', className)}>
      {/* One common coordinate system: HeroVisual is the single positioning frame
          for the orbit, the profiles and the badges. Everything is centered here. */}
      <div
        role="img"
        aria-label="NextEra founders Khyruddin Hashanulla and Shagaf Sayeka with the learning platform features they offer"
        className="relative mx-auto flex h-[23rem] w-full max-w-md items-center justify-center sm:h-[31rem] sm:max-w-lg md:h-[35rem] md:max-w-xl lg:h-[36rem] lg:max-w-none xl:h-[42rem]"
      >
        {/* z-0 — decorative glow */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-6 z-0">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-aura-secondary/15 blur-3xl" />
        </div>

        {/* z-1 — OrbitSystem: fills HeroVisual and centers each ring via flexbox.
            The rings are flex children, so Framer Motion's rotate transform can never
            override a translate — the rings stay locked to the visual center. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
          {orbitRings.map((ring, index) => (
            <motion.div
              key={index}
              className={cn('absolute', ring.className)}
              animate={reduceMotion ? undefined : { rotate: ring.reverse ? -360 : 360 }}
              transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke={ring.stroke}
                  strokeWidth="0.3"
                  strokeDasharray={ring.dash}
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          ))}
        </div>

        {/* ProfileGroup — the combined bounding box of BOTH profiles.
            It is a flex child of HeroVisual, so its center is exactly the visual center,
            which is the same point the orbit rings rotate around. */}
        <div className="relative h-56 w-56 sm:h-80 sm:w-80 md:h-[23rem] md:w-[23rem] lg:h-[25rem] lg:w-[25rem] xl:h-[32rem] xl:w-[32rem]">
          {/* z-10 — Khyruddin: primary, larger, behind */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
            className="absolute left-0 top-0 z-10"
          >
            <div className="relative h-40 w-40 sm:h-56 sm:w-56 md:h-64 md:w-64 lg:h-[17rem] lg:w-[17rem] xl:h-[22.25rem] xl:w-[22.25rem]">
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 to-aura-secondary/25 blur-xl"
              />
              <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/20 shadow-2xl shadow-primary/30">
                <img
                  src={founders[0].image}
                  alt={founders[0].alt}
                  width={founders[0].width}
                  height={founders[0].height}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover object-[center_35%]"
                />
              </div>
              <figcaption className="absolute bottom-full left-0 z-30 mb-2 max-w-[9.5rem] sm:max-w-[12rem]">
                <p className="font-display text-sm font-bold leading-snug tracking-tight text-foreground sm:text-base">
                  {founders[0].name}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {founders[0].role}
                </p>
              </figcaption>
            </div>
          </motion.div>

          {/* z-20 — Shagaf: secondary, smaller, bottom-right, in front */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: easeOut }}
            className="absolute bottom-0 right-0 z-20"
          >
            <div className="relative h-[5.5rem] w-[5.5rem] sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-[11rem] lg:w-[11rem] xl:h-[13.75rem] xl:w-[13.75rem]">
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-full bg-gradient-to-bl from-cyan-400/25 to-primary/30 blur-xl"
              />
              <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/20 shadow-2xl shadow-aura-secondary/30">
                <img
                  src={founders[1].image}
                  alt={founders[1].alt}
                  width={founders[1].width}
                  height={founders[1].height}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </motion.div>

          <figcaption className="absolute right-0 top-full z-30 mt-2 max-w-[10.5rem] text-right sm:max-w-[11rem] lg:max-w-[14rem]">
            <p className="font-display text-sm font-bold leading-snug tracking-tight text-foreground sm:text-base">
              {founders[1].name}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {founders[1].role}
            </p>
          </figcaption>
        </div>

        {/* z-40 — FeatureBadges: positioned around the orbit system, relative to HeroVisual */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-40">
          {featureBadges.map((badge, index) => {
            const Icon = badge.icon;
            const accentClass = badge.accent === 'purple' ? 'text-primary' : 'text-cyan-400';
            return (
              <div key={badge.label} className={cn('absolute', badge.position)}>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                  animate={
                    reduceMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 1, scale: 1, y: [0, -4, 0] }
                  }
                  transition={{
                    opacity: { duration: 0.5, delay: 0.5 + index * 0.08 },
                    scale: { duration: 0.5, delay: 0.5 + index * 0.08 },
                    y: {
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.4,
                    },
                  }}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-background/75 shadow-lg shadow-black/10 backdrop-blur',
                    badge.pill === 'lg' && 'h-9 px-3.5 sm:h-10 sm:px-4',
                    badge.pill === 'node' && 'h-9 w-9 sm:h-10 sm:w-10'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', accentClass)} aria-hidden="true" />
                  {badge.pill === 'lg' && (
                    <span className="whitespace-nowrap text-xs font-semibold text-foreground sm:text-sm">
                      {badge.label}
                    </span>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
