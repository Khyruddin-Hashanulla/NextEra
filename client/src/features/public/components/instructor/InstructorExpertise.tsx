import { memo, useMemo } from 'react';
import { Sparkles, Layers, Target, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Reveal } from './Reveal';
import type { InstructorProfile } from './types';

interface InstructorExpertiseProps {
  instructor: InstructorProfile;
}

interface ExpertiseGroup {
  icon: LucideIcon;
  title: string;
  items: string[];
}

export const InstructorExpertise = memo(function InstructorExpertise({ instructor }: InstructorExpertiseProps) {
  const profile = instructor.instructorProfile;

  const groups = useMemo<ExpertiseGroup[]>(() => {
    const skills = profile.expertise ?? [];
    const categories = profile.teachingCategories ?? [];
    const focusAreas = instructor.specialties ?? [];

    const focusIsDuplicate =
      focusAreas.length > 0 &&
      skills.length > 0 &&
      focusAreas.length === skills.length &&
      focusAreas.every((item) => skills.includes(item));

    const result: ExpertiseGroup[] = [];
    if (skills.length > 0) result.push({ icon: Sparkles, title: 'Skills', items: skills });
    if (categories.length > 0) result.push({ icon: Layers, title: 'Categories', items: categories });
    if (focusAreas.length > 0 && !focusIsDuplicate)
      result.push({ icon: Target, title: 'Focus Areas', items: focusAreas });
    return result;
  }, [profile.expertise, profile.teachingCategories, instructor.specialties]);

  if (groups.length === 0) return null;

  return (
    <Reveal>
      <div id="expertise" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Areas of Expertise</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <group.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </span>
                {group.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    size="lg"
                    className="bg-background/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
});
