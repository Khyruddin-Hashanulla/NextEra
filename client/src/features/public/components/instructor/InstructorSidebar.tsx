import { memo, type ReactNode } from 'react';
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
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
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
      <aside className="space-y-5 lg:sticky lg:top-24">
        <SidebarCard title="Contact Information">
          <FactRow icon={Mail} label="Email" value={instructor.email} />
          <FactRow icon={Phone} label="Phone" value={instructor.phone} />
          <FactRow icon={MapPin} label="Location" value={instructor.address} />
          {memberSince && <FactRow icon={CalendarDays} label="Member Since" value={memberSince} />}
        </SidebarCard>

        {hasSocials && (
          <SidebarCard title="Connect">
            <InstructorSocialLinks links={instructor.socialLinks} />
          </SidebarCard>
        )}

        {hasDocuments && (
          <SidebarCard title="Credentials">
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
          </SidebarCard>
        )}
      </aside>
    </Reveal>
  );
});
