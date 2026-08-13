import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Clock, MapPin, ArrowRight } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/features/public/components/instructor/RatingStars';
import { InstructorSocialLinks } from '@/features/public/components/instructor/InstructorSocialLinks';
import { avatarUrl, type InstructorCardData } from '@/features/public/components/instructor/types';

interface InstructorCardProps {
  instructor: InstructorCardData;
  className?: string;
}

/** Premium instructor card: cover strip, verified badge, gradient-border hover,
 *  socials and animated CTA. Consumes the flexible InstructorCardData type so it
 *  renders with either the list or the full profile payload. */
export const InstructorCard = memo(function InstructorCard({ instructor, className }: InstructorCardProps) {
  const avatar = avatarUrl(instructor.avatar);
  const hasSocials = Boolean(instructor.socialLinks && Object.values(instructor.socialLinks).some(Boolean));
  const showVerified = instructor.verified !== false;

  return (
    <article
      className={cn(
        'group relative h-full rounded-2xl transition-transform duration-300 hover:-translate-y-2',
        className
      )}
    >
      {/* Gradient border shown on hover */}
      <div
        className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/60 via-aura-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/10">
        {/* Cover strip */}
        <div className="relative h-24 bg-gradient-to-br from-primary via-primary/70 to-aura-primary" aria-hidden="true">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        </div>

        {/* Avatar + verified badge */}
        <div className="relative -mt-12 px-6">
          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-primary via-primary/60 to-aura-primary p-1 shadow-lg shadow-primary/20">
            <Avatar className="h-full w-full ring-4 ring-card">
              {avatar ? <AvatarImage src={avatar} alt={`Profile photo of ${instructor.name}`} /> : null}
              <AvatarFallback className="bg-background text-xl font-bold text-primary">
                {getInitials(instructor.name)}
              </AvatarFallback>
            </Avatar>
            {showVerified && (
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border"
                title="Verified Instructor"
                aria-label="Verified Instructor"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-primary" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2.5 14 4l2.4-.4 1 2.2 2.3 1-.4 2.4L21 12l-1.7 1.8.4 2.4-2.3 1-1 2.2-2.4-.4L12 21.5 10 20l-2.4.4-1-2.2-2.3-1 .4-2.4L3 12l1.7-1.8-.4-2.4 2.3-1 1-2.2 2.4.4z"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-6 pb-6 pt-3 text-center">
          <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
            <Link
              to={`/instructors/${instructor._id}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {instructor.name}
            </Link>
          </h3>
          {instructor.title && <p className="mt-0.5 text-sm font-medium text-primary">{instructor.title}</p>}

          {instructor.bio && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{instructor.bio}</p>
          )}

          {instructor.rating ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-foreground">{instructor.rating.toFixed(1)}</span>
              <RatingStars value={instructor.rating} size={14} />
              {instructor.totalReviews ? (
                <span className="text-xs text-muted-foreground">({instructor.totalReviews})</span>
              ) : null}
            </div>
          ) : null}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span className="flex w-full items-center justify-center gap-1 font-semibold text-foreground">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{instructor.studentsCount ?? 0}</span>
              </span>
              Students
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span className="flex w-full items-center justify-center gap-1 font-semibold text-foreground">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{instructor.coursesCount ?? 0}</span>
              </span>
              Courses
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span className="flex w-full items-center justify-center gap-1 font-semibold text-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate" title={instructor.experience}>
                  {instructor.experience || '—'}
                </span>
              </span>
              Experience
            </div>
          </div>

          {/* Skills */}
          {instructor.specialties && instructor.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {instructor.specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="outline" size="sm" className="bg-background/60">
                  {specialty}
                </Badge>
              ))}
              {instructor.specialties.length > 3 && (
                <span className="text-xs text-muted-foreground">+{instructor.specialties.length - 3} more</span>
              )}
            </div>
          )}

          {instructor.country && (
            <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {instructor.country}
            </p>
          )}

          {hasSocials && (
            <div className="mt-4 flex justify-center opacity-80 transition-opacity duration-300 group-hover:opacity-100">
              <InstructorSocialLinks links={instructor.socialLinks!} size="sm" />
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-5">
            <Button asChild fullWidth>
              <Link to={`/instructors/${instructor._id}`}>
                View Profile
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
});
