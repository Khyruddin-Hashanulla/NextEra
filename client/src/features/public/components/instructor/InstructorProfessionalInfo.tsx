import { memo } from 'react';
import { Briefcase, MapPin, CalendarDays, BadgeCheck } from 'lucide-react';
import { Reveal } from './Reveal';
import { InstructorExperienceTimeline } from './InstructorExperienceTimeline';
import type { InstructorProfile } from './types';

interface InstructorProfessionalInfoProps {
  instructor: InstructorProfile;
}

function Fact({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export const InstructorProfessionalInfo = memo(function InstructorProfessionalInfo({
  instructor,
}: InstructorProfessionalInfoProps) {
  const profile = instructor.instructorProfile;
  const hasData = Boolean(
    profile.qualification ||
      profile.experience ||
      profile.resume?.url ||
      profile.demoVideo?.url
  );

  if (!hasData) return null;

  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  return (
    <Reveal>
      <div id="professional" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Professional Information</h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InstructorExperienceTimeline
              qualification={profile.qualification}
              experience={profile.experience}
            />
          </div>

          <aside className="space-y-5 rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Quick Facts
            </h3>
            <Fact icon={Briefcase} label="Role" value={`Instructor at NextEra`} />
            {instructor.address && <Fact icon={MapPin} label="Location" value={instructor.address} />}
            {memberSince && <Fact icon={CalendarDays} label="Member since" value={memberSince} />}
          </aside>
        </div>
      </div>
    </Reveal>
  );
});
