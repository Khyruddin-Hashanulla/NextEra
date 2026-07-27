import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? 'text-green-600' : 'text-red-600')}>
                {trend.positive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
