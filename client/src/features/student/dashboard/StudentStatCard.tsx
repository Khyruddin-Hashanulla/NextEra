import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StudentStat {
  key: 'totalCourses' | 'inProgress' | 'completedCourses' | 'certificates';
  label: string;
  description: string;
  icon: LucideIcon;
  bar: string;
  iconClass: string;
}

interface StudentStatCardProps {
  stat: StudentStat;
  value: number;
}

export function StudentStatCard({ stat, value }: StudentStatCardProps) {
  const Icon = stat.icon;

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-0.5', stat.bar)} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">{stat.description}</p>
          </div>
          <span
            aria-hidden="true"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
              stat.iconClass
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}