import { PageTransition } from '@/components/common/PageTransition';
import { ROUTES } from '@/lib/constants';
import { SEO } from '@/components/seo/SEO';
import { SEO_DEFAULTS } from '@/lib/seo';

import { Hero } from '../components/Hero';
import { CompanyLogoSection } from '../components/home/CompanyLogoSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { FeaturedCourses } from '../components/home/FeaturedCourses';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { InstructorPromo } from '../components/home/InstructorPromo';
import { LearningStats } from '../components/home/LearningStats';
import { Testimonials } from '../components/home/Testimonials';
import { HomeBlogSection } from '../components/home/HomeBlogSection';
import { NewsletterSection } from '../components/home/NewsletterSection';
import { useHomePageData } from '../components/home/useHomePageData';

export function HomePage() {
  const {
    featuredCourses,
    featuredCoursesLoading,
    featuredCoursesError,
    featuredCoursesRefetch,
    blogs,
    blogsLoading,
    blogsError,
    blogsRefetch,
    categories,
    stats,
    testimonials,
  } = useHomePageData();

  return (
    <PageTransition>
      <SEO
        title={SEO_DEFAULTS.DEFAULT_TITLE}
        description="Join NextEra and master web development, programming, and technology skills with expert-led courses."
        canonical="/"
      />
      <div className="min-h-screen overflow-x-clip">
        <Hero stats={stats} />

        <CompanyLogoSection />

        <CategoriesSection
          categories={categories}
          isLoading={featuredCoursesLoading && categories.length === 0}
          className="py-16 sm:py-24 lg:py-28"
        />

        <FeaturedCourses
          courses={featuredCourses}
          isLoading={featuredCoursesLoading}
          isError={!!featuredCoursesError}
          onRetry={() => featuredCoursesRefetch()}
          viewAllHref={ROUTES.COURSES}
          className="bg-muted/40 py-16 sm:py-24 lg:py-28"
        />

        <WhyChooseUs />

        <InstructorPromo />

        <LearningStats stats={stats} isLoading={featuredCoursesLoading} />

        <Testimonials testimonials={testimonials} isLoading={featuredCoursesLoading} />

        <HomeBlogSection
          blogs={blogs}
          isLoading={blogsLoading}
          isError={!!blogsError}
          onRetry={() => blogsRefetch()}
          className="bg-muted/40 py-16 sm:py-24 lg:py-28"
        />

        <NewsletterSection />
      </div>
    </PageTransition>
  );
}
