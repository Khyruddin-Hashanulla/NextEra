import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export function ExploreCoursesCard() {
  return (
    <Card className="flex h-full flex-col items-center justify-center overflow-hidden border-dashed border-border/70 bg-accent/30 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 font-display text-base font-bold text-foreground">Explore more courses</p>
        <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
          Discover your next learning journey
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </CardContent>
    </Card>
  );
}