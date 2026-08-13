import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { formatCompactCount } from './AnimatedNumber';
import type { HeroTopic } from './topicData';

interface HeroTopicCardProps {
  topic: HeroTopic;
  className?: string;
}

export function HeroTopicCard({ topic, className }: HeroTopicCardProps) {
  const Icon = topic.icon;

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10 transition-transform duration-300 hover:-translate-y-1 sm:p-7',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-violet-500/[0.07]"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110',
            topic.gradient
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          Explore
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>

      <p className="relative mt-5 font-display text-xl font-bold tracking-tight text-foreground">{topic.name}</p>

      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{topic.description}</p>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5">
          <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{formatCompactCount(topic.courses)}+</p>
            <p className="truncate text-xs text-muted-foreground">Courses</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5">
          <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{formatCompactCount(topic.students)}+</p>
            <p className="truncate text-xs text-muted-foreground">Students</p>
          </div>
        </div>
      </div>

      <Link
        to={ROUTES.COURSES}
        aria-label={`Explore ${topic.name} courses`}
        className="relative mt-5 flex items-center justify-center gap-2 rounded-full border border-border bg-muted/40 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Start learning
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
