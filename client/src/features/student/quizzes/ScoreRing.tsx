import { cn } from '@/lib/utils';

interface ScoreRingProps {
  percentage: number;
  passed: boolean;
  size?: number;
}

export function ScoreRing({ percentage, passed, size = 64 }: ScoreRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      role="img"
      aria-label={`${clamped}% score, ${passed ? 'passed' : 'failed'}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true" focusable="false">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-[stroke-dashoffset] duration-500', passed ? 'stroke-success' : 'stroke-destructive')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums text-foreground">{clamped}%</span>
      </div>
    </div>
  );
}