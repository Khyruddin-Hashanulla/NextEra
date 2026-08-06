import { memo } from 'react';
import { Mail, Phone, MapPin, CalendarDays, FileText, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './Reveal';
import { InstructorSocialLinks } from './InstructorSocialLinks';
import type { InstructorProfile } from './types';

interface InstructorSidebarProps {
  instructor: InstructorProfile;
}

function FactRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

/** Sticky contact & credential card shown on the right rail (desktop) and
 *  below the main content on mobile. */
export const InstructorSidebar = memo(function InstructorSidebar({ instructor }: InstructorSidebarProps) {
  const profile = instructor.instructorProfile;
  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const hasSocials = Object.values(instructor.socialLinks ?? {}).some(Boolean);
  const hasDocuments = Boolean(profile.resume?.url || profile.demoVideo?.url);

  return (
    <Reveal>
      <aside className="space-y-6 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Contact Information</h2>
          <div className="mt-4 space-y-4">
            <FactRow icon={Mail} label="Email" value={instructor.email} />
            <FactRow icon={Phone} label="Phone" value={instructor.phone} />
            <FactRow icon={MapPin} label="Location" value={instructor.address} />
            {memberSince && <FactRow icon={CalendarDays} label="Member Since" value={memberSince} />}
          </div>
        </div>

        {hasSocials && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Follow {instructor.name.split(' ')[0]}
            </h2>
            <InstructorSocialLinks links={instructor.socialLinks} />
          </div>
        )}

        {hasDocuments && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Credentials</h2>
            <div className="mt-4 space-y-3">
              {profile.resume?.url && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <a href={profile.resume.url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    View Resume
                  </a>
                </Button>
              )}
              {profile.demoVideo?.url && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <a href={profile.demoVideo.url} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    Watch Intro Video
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </aside>
    </Reveal>
  );
});
