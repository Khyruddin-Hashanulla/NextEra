import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BadgeCheck,
  BookOpen,
  Users,
  MapPin,
  CalendarDays,
  MessageCircle,
  Heart,
  Clock,
  Star,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import { getInitials, formatNumber, cn } from '@/lib/utils';
import { RatingStars } from './RatingStars';
import { InstructorSocialLinks } from './InstructorSocialLinks';
import { ShareButton } from './ShareButton';
import { avatarUrl, type InstructorProfile } from './types';

interface InstructorHeroProps {
  instructor: InstructorProfile;
}

interface Highlight {
  icon: LucideIcon;
  text: string;
}

export function InstructorHero({ instructor }: InstructorHeroProps) {
  const [following, setFollowing] = useState(false);
  const { addToast } = useToast();
  const reduceMotion = useReducedMotion();

  const profile = instructor.instructorProfile;
  const title = profile.qualification || 'Instructor';
  const avatar = avatarUrl(instructor.avatar);
  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const showExperienceBadge = Boolean(profile.experience && profile.experience.length <= 28);

  const highlights: Highlight[] = [];
  if (instructor.averageRating > 0) {
    highlights.push({
      icon: Star,
      text: `Rated ${instructor.averageRating.toFixed(1)} by ${formatNumber(instructor.totalReviews)} learners`,
    });
  }
  if (instructor.totalStudents > 0) {
    highlights.push({ icon: Users, text: `${formatNumber(instructor.totalStudents)} students taught` });
  }
  if (instructor.totalCourses > 0) {
    highlights.push({ icon: BookOpen, text: `${instructor.totalCourses} published courses` });
  }
  if (profile.experience && !showExperienceBadge) {
    highlights.push({ icon: Clock, text: `${profile.experience} of experience` });
  }
  if (memberSince) {
    highlights.push({ icon: CalendarDays, text: `Teaching on NextEra since ${memberSince}` });
  }

  const handleFollow = () => {
    const next = !following;
    setFollowing(next);
    addToast({
      title: next ? `Following ${instructor.name}` : `Unfollowed ${instructor.name}`,
      description: next ? 'You will see updates from this instructor.' : undefined,
      variant: next ? 'success' : 'info',
    });
  };

  const handleMessage = () => {
    addToast({
      title: 'Messaging is coming soon',
      description: 'Direct messaging between students and instructors is on our roadmap.',
      variant: 'info',
    });
  };

  const heroMotion = reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-muted/40 to-background">
      {avatar && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img
            src={avatar}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover opacity-[0.12] blur-2xl"
          />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/60"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <motion.div
          {...heroMotion}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-10"
        >
          {/* Identity zone */}
          <div className="min-w-0 space-y-5 text-center md:text-left">
            <div className="relative mx-auto w-fit md:mx-0">
              <div className="rounded-full bg-gradient-to-tr from-primary via-primary/60 to-aura-primary p-1 shadow-xl shadow-primary/25">
                <Avatar className="h-28 w-28 ring-4 ring-background sm:h-36 sm:w-36">
                  <AvatarImage src={avatar} alt={`Profile photo of ${instructor.name}`} />
                  <AvatarFallback className="text-3xl font-bold text-primary sm:text-4xl">
                    {getInitials(instructor.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-semibold shadow-md ring-1 ring-border">
                <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Verified
              </span>
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                {instructor.name}
              </h1>
              <p className="text-base font-medium text-primary sm:text-lg">{title}</p>
            </div>

            <div className="flex flex-col items-center gap-x-4 gap-y-2 sm:flex-row sm:flex-wrap">
              {instructor.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{instructor.averageRating.toFixed(1)}</span>
                  <RatingStars value={instructor.averageRating} size={16} />
                  <span className="text-sm text-muted-foreground">
                    ({formatNumber(instructor.totalReviews)} reviews)
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground md:justify-start">
                {instructor.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {instructor.address}
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    Member since {memberSince}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Badge variant="secondary" size="lg" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {instructor.totalCourses} courses
              </Badge>
              <Badge variant="secondary" size="lg" className="gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {formatNumber(instructor.totalStudents)} students
              </Badge>
              {showExperienceBadge && (
                <Badge variant="secondary" size="lg" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {profile.experience}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 md:justify-start">
              <Button variant={following ? 'secondary' : 'default'} onClick={handleFollow} aria-pressed={following}>
                <Heart className={cn('h-4 w-4', following && 'fill-current')} aria-hidden="true" />
                {following ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" onClick={handleMessage}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Message
              </Button>
              <ShareButton title={`${instructor.name} on NextEra`} text={instructor.bio} />
            </div>

            <div className="flex justify-center pt-1 md:justify-start">
              <InstructorSocialLinks links={instructor.socialLinks} />
            </div>
          </div>

          {/* Highlights panel */}
          {highlights.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-lg shadow-primary/5 backdrop-blur-sm sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Why learn with {instructor.name.split(' ')[0]}
              </p>
              <ul className="mt-4 space-y-3">
                {highlights.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 items-start gap-2.5 text-sm font-medium leading-relaxed text-foreground">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#courses"
                className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Explore courses
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}