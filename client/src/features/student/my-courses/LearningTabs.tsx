import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, PlayCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseFilter } from './useMyCourses';

interface LearningTabsProps {
  active: CourseFilter;
  counts: { total: number; inProgress: number; completed: number };
  onChange: (filter: CourseFilter) => void;
}

interface TabDef {
  key: CourseFilter;
  label: string;
  icon: typeof BookOpen;
  countKey: keyof LearningTabsProps['counts'];
}

const tabs: TabDef[] = [
  { key: 'all', label: 'All Courses', icon: BookOpen, countKey: 'total' },
  { key: 'in-progress', label: 'In Progress', icon: PlayCircle, countKey: 'inProgress' },
  { key: 'completed', label: 'Completed', icon: Award, countKey: 'completed' },
];

export function LearningTabs({ active, counts, onChange }: LearningTabsProps) {
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef<Partial<Record<CourseFilter, HTMLButtonElement | null>>>({});

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[next];
    onChange(tab.key);
    tabRefs.current[tab.key]?.focus();
  };

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted p-1"
      role="tablist"
      aria-label="Filter courses"
      onKeyDown={(e) => handleKeyDown(e, tabs.findIndex((t) => t.key === active))}
    >
      {tabs.map(({ key, label, icon: Icon, countKey }) => {
        const isActive = active === key;
        const count = counts[countKey];
        return (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[key] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={isActive}
            aria-controls={`panel-${key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(key)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive &&
              (reduceMotion ? (
                <span className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border" />
              ) : (
                <motion.span
                  layoutId="my-courses-tab"
                  className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ))}
            <Icon
              className={cn('relative z-10 h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')}
              aria-hidden="true"
            />
            <span className="relative z-10">{label}</span>
            {count > 0 && (
              <span
                className={cn(
                  'relative z-10 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}