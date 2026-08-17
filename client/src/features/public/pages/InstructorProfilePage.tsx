import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Section } from '@/components/common/Section';
import { ErrorState } from '@/components/common/ErrorState';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { studentApi } from '@/api/endpoints/student';
import { categorizeError } from '@/lib/error-utils';
import { ROUTES } from '@/lib/constants';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { personSchema, breadcrumbListSchema } from '@/lib/schema';
import { buildCanonical } from '@/lib/seo';
import { Link } from 'react-router-dom';
import { InstructorHero } from '@/features/public/components/instructor/InstructorHero';
import { InstructorStats } from '@/features/public/components/instructor/InstructorStats';
import { InstructorAbout } from '@/features/public/components/instructor/InstructorAbout';
import { InstructorExpertise } from '@/features/public/components/instructor/InstructorExpertise';
import { InstructorProfessionalInfo } from '@/features/public/components/instructor/InstructorProfessionalInfo';
import { InstructorCourses } from '@/features/public/components/instructor/InstructorCourses';
import { InstructorSidebar } from '@/features/public/components/instructor/InstructorSidebar';
import { InstructorPageSkeleton } from '@/features/public/components/instructor/InstructorPageSkeleton';
import type { InstructorProfile } from '@/features/public/components/instructor/types';
import type { Course } from '@/types/instructor';

const InstructorReviews = lazy(() =>
  import('@/features/public/components/instructor/InstructorReviews').then((m) => ({
    default: m.InstructorReviews,
  }))
);

const RelatedInstructors = lazy(() =>
  import('@/features/public/components/instructor/RelatedInstructors').then((m) => ({
    default: m.RelatedInstructors,
  }))
);

function SectionFallback({ className }: { className?: string }) {
  return <Skeleton className={`h-52 rounded-2xl ${className ?? ''}`} />;
}

const SECTION_NAV = [
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'professional', label: 'Professional' },
  { id: 'courses', label: 'Courses' },
  { id: 'reviews', label: 'Reviews' },
];

export function InstructorProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses', id],
    queryFn: ({ signal }) =>
      studentApi
        .listCourses({ limit: 100 }, signal)
        .then((r) => ((r.data.data?.courses ?? []) as Course[]).filter((c) => c.instructor?._id === id)),
    enabled: !!id,
  });

  const {
    data: instructorData,
    isLoading: instructorLoading,
    error,
  } = useQuery({
    queryKey: ['instructor-profile', id],
    queryFn: ({ signal }) => studentApi.getInstructorProfile(id!, signal).then((r) => r.data.data),
    enabled: !!id,
  });

  const instructor: InstructorProfile | undefined = instructorData;
  const courses = coursesData || [];

  if (instructorLoading) return <InstructorPageSkeleton />;

  if (error || !instructor) {
    if (!instructor && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="instructor" />;
    }
    if (categorizeError(error) === 'network') {
      return (
        <ErrorState
          title="Connection Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return (
      <ErrorState
        title="Instructor Not Found"
        message="This instructor profile doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const profile = instructor.instructorProfile;
  const seoTitle = `${instructor.name} - Instructor`;

  return (
    <div className="min-h-screen">
      <SEO
        title={seoTitle}
        description={instructor.bio || `Learn from instructor ${instructor.name} on NextEra.`}
        image={instructor.avatar?.url || ''}
        url={`/instructors/${id}`}
        canonical={`/instructors/${id}`}
        type="profile"
      />
      <StructuredData
        schemas={[
          personSchema({
            name: instructor.name,
            image: instructor.avatar?.url,
            bio: instructor.bio,
            jobTitle: profile.qualification || 'Instructor',
            url: buildCanonical(`/instructors/${id}`),
            sameAs: [
              instructor.socialLinks?.linkedin,
              instructor.socialLinks?.twitter,
              instructor.socialLinks?.github,
              instructor.socialLinks?.website,
              instructor.socialLinks?.portfolio,
            ].filter(Boolean),
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Instructors', path: '/instructors' },
            { name: instructor.name, path: `/instructors/${id}` },
          ]),
        ]}
      />

      <InstructorHero instructor={instructor} />

      <Section size="sm" className="pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 lg:pb-14">
        {/* In-page anchor nav */}
        <nav
          aria-label="On this page"
          className="-mt-2 mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SECTION_NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <InstructorStats instructor={instructor} />
            <InstructorAbout name={instructor.name} bio={instructor.bio} />
            <InstructorExpertise instructor={instructor} />
            <InstructorProfessionalInfo instructor={instructor} />
            <InstructorCourses courses={courses} instructorName={instructor.name} isLoading={coursesLoading} />
            <Suspense fallback={<SectionFallback />}>
              <InstructorReviews instructor={instructor} />
            </Suspense>
          </div>

          {/* Sticky sidebar */}
          <InstructorSidebar instructor={instructor} />
        </div>
      </Section>

      {/* Related instructors */}
      <Section size="sm" className="pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10 lg:pb-12">
        <Suspense fallback={<SectionFallback className="h-72" />}>
          <RelatedInstructors instructorId={instructor._id} instructorName={instructor.name} />
        </Suspense>
      </Section>

      {/* CTA */}
      <Section size="sm" background="gradient" className="pt-10 sm:pt-12 lg:pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Ready to learn from {instructor.name}?
          </h2>
          <p className="mt-3 text-muted-foreground">Explore their courses and start building new skills today.</p>
          <Button asChild variant="outline" size="lg" className="mt-4">
            <Link to={ROUTES.COURSES}>Browse All Courses</Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}
