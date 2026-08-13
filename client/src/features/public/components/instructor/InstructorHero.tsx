import { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, BookOpen, Users, MapPin, CalendarDays, MessageCircle, Heart, Clock } from 'lucide-react';
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

export function InstructorHero({ instructor }: InstructorHeroProps) {
  const [following, setFollowing] = useState(false);
  const { addToast } = useToast();

  const profile = instructor.instructorProfile;
  const title = profile.qualification || 'Instructor';
  const avatar = avatarUrl(instructor.avatar);
  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const showExperienceBadge = Boolean(profile.experience && profile.experience.length <= 28);

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

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-muted/40 to-background">
      {avatar && (
        <img
          src={avatar}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] blur-2xl"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/60"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col gap-8 md:flex-row md:items-center"
        >
          <div className="relative shrink-0 self-center md:self-auto">
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

          <div className="min-w-0 flex-1 space-y-4 text-center md:text-left">
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

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
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

            <div className="flex justify-center pt-2 md:justify-start">
              <InstructorSocialLinks links={instructor.socialLinks} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
