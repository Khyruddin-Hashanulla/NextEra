import { memo } from 'react';
import { GraduationCap, Briefcase, type LucideIcon } from 'lucide-react';

interface InstructorExperienceTimelineProps {
  qualification?: string;
  experience?: string;
}

interface TimelineNode {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Vertical timeline built only from real profile data. */
export const InstructorExperienceTimeline = memo(function InstructorExperienceTimeline({
  qualification,
  experience,
}: InstructorExperienceTimelineProps) {
  const nodes: TimelineNode[] = [];
  if (qualification) nodes.push({ icon: GraduationCap, title: 'Education', description: qualification });
  if (experience) nodes.push({ icon: Briefcase, title: 'Experience', description: experience });

  if (nodes.length === 0) return null;

  return (
    <ol className="relative space-y-8">
      <span className="absolute bottom-2 left-[13px] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
      {nodes.map((node) => (
        <li key={node.title} className="relative pl-10">
          <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm">
            <node.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{node.title}</h3>
          <p className="mt-1 leading-relaxed text-foreground">{node.description}</p>
        </li>
      ))}
    </ol>
  );
});
