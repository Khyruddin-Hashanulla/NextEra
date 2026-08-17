import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Clock, Copy, Check, AlertCircle } from 'lucide-react';
import { cn, getInitials, formatNumber } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/features/public/components/instructor/RatingStars';
import { avatarUrl, type InstructorCardData } from '@/features/public/components/instructor/types';

interface InstructorCardProps {
  instructor: InstructorCardData;
  className?: string;
}

const EXPERIENCE_CHAR_LIMIT = 18;
const STAT_CHAR_LIMIT = 16;

function limitText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Accessible "Copy Email" action with clipboard feedback and graceful
 *  fallback for non-secure contexts. Renders a live region for screen readers. */
function CopyEmailButton({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setStatus('copied');
    } catch {
      setStatus('error');
    }
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setStatus('idle'), 2000);
  };

  const Icon = status === 'copied' ? Check : status === 'error' ? AlertCircle : Copy;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleCopy}
        aria-label={`Copy email address ${email}`}
        title={email}
        className="h-10 w-10 shrink-0"
      >
        <Icon
          className={cn(
            'h-4 w-4',
            status === 'copied' ? 'text-success' : status === 'error' ? 'text-destructive' : ''
          )}
          aria-hidden="true"
        />
      </Button>
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Email copied to clipboard'
          : status === 'error'
            ? 'Could not copy the email address'
            : ''}
      </span>
    </>
  );
}

/** Compact premium instructor card: status row, image, name, designation,
 *  rating, primary + copy-email actions and a green accent footer built from
 *  real instructor stats. Consumes the flexible InstructorCardData type so it
 *  renders with either the list or the full profile payload. */
export const InstructorCard = memo(function InstructorCard({ instructor, className }: InstructorCardProps) {
  const avatar = avatarUrl(instructor.avatar);
  const profileHref = `/instructors/${instructor._id}`;
  const showVerified = instructor.verified !== false;
  const hasEmail = Boolean(instructor.email);

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10',
        className
      )}
    >
      {/* Top hairline highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />

      {/* Status / availability row */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <span
          className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium"
          aria-label={showVerified ? 'Verified Instructor' : 'Instructor'}
        >
          <span
            className={cn('h-2 w-2 shrink-0 rounded-full', showVerified ? 'bg-success' : 'bg-muted-foreground/50')}
            aria-hidden="true"
          />
          <span className={cn('truncate', showVerified ? 'text-success' : 'text-muted-foreground')}>
            {showVerified ? 'Verified' : 'Instructor'}
          </span>
        </span>
        {instructor.experience && (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span title={instructor.experience} className="truncate max-w-[9rem]">
              {limitText(instructor.experience, EXPERIENCE_CHAR_LIMIT)}
            </span>
          </span>
        )}
      </div>

      {/* Image */}
      <div className="px-5 pt-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Avatar className="h-full w-full rounded-xl">
            <AvatarImage
              src={avatar}
              alt={`Profile photo of ${instructor.name}`}
              className="aspect-auto object-[50%_25%]"
            />
            <AvatarFallback className="rounded-xl bg-muted text-2xl font-bold text-primary">
              {getInitials(instructor.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-0 pt-4 text-center">
        <h3 className="break-words text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          <Link
            to={profileHref}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {instructor.name}
          </Link>
        </h3>
        {instructor.title && <p className="mt-0.5 text-xs font-medium text-primary">{instructor.title}</p>}

        {instructor.rating ? (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-sm">
            <span className="font-bold text-foreground">{instructor.rating.toFixed(1)}</span>
            <RatingStars value={instructor.rating} size={13} />
            {instructor.totalReviews ? (
              <span className="text-xs text-muted-foreground">({formatNumber(instructor.totalReviews)})</span>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-auto flex items-stretch gap-2 pt-4">
          <Button asChild size="sm" className="flex-1">
            <Link to={profileHref}>View Profile</Link>
          </Button>
          {hasEmail && <CopyEmailButton email={instructor.email!} />}
        </div>
      </div>

      {/* Green accent footer */}
      <div className="mt-3 border-t border-success/15 bg-success/10 px-5 py-2.5">
        <div className="grid grid-cols-2 items-center gap-x-4 text-sm">
          <span className="inline-flex min-w-0 items-center justify-start gap-1.5 font-semibold text-foreground">
            <BookOpen className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span
              title={`${instructor.coursesCount ?? 0} Courses`}
              className="truncate"
            >
              {limitText(`${instructor.coursesCount ?? 0} Courses`, STAT_CHAR_LIMIT)}
            </span>
          </span>
          <span className="inline-flex min-w-0 items-center justify-end gap-1.5 font-semibold text-foreground">
            <Users className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span
              title={`${formatNumber(instructor.studentsCount ?? 0)} Students`}
              className="truncate"
            >
              {limitText(`${formatNumber(instructor.studentsCount ?? 0)} Students`, STAT_CHAR_LIMIT)}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
});