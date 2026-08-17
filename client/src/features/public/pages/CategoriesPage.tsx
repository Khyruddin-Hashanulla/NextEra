import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { categoryApi } from '@/api/endpoints/category';
import { QUERY_KEYS } from '@/lib/constants';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';
import { CategoryCard } from '../components/categories/CategoryCard';
import type { Category } from '@/types/admin';

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="mt-5 h-6 w-3/4" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-6 h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

export function CategoriesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.categories.list(),
    queryFn: ({ signal }) => categoryApi.listCategories(signal).then((r) => r.data.data),
  });

  const categories: Category[] = (data ?? []).filter((cat) => cat.isActive !== false);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Section size="sm" className="relative overflow-hidden">
          <Container>
            <div className="mx-auto max-w-5xl">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="mt-6 h-12 w-96 max-w-full" />
              <Skeleton className="mt-4 h-5 w-full max-w-xl" />
            </div>
          </Container>
        </Section>
        <Section size="sm" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <CategoryGridSkeleton />
            </div>
          </Container>
        </Section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <SEO title="Categories" description="Browse course categories on NextEra." canonical="/categories" />
        <ErrorState
          title="Failed to load categories"
          message="Please try again or check your connection."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Categories"
        description="Explore NextEra's course categories and find the right path for your learning journey."
        canonical="/categories"
      />
      <StructuredData
        schemas={[
          webPageSchema({ name: 'Categories', description: 'Explore NextEra course categories.', path: '/categories' }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Categories', path: '/categories' },
          ]),
        ]}
      />
      <div className="min-h-screen overflow-x-clip">
        {/* Hero */}
        <Section size="sm" id="hero" className="relative overflow-hidden">
          <PageBackground variant="hero" className="absolute inset-0" />
          <Container>
            <div className="relative z-10 mx-auto max-w-5xl">
              <div className="max-w-3xl">
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
                >
                  Categories
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Explore Our Categories
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Choose a category to discover focused, practical courses built by industry experts.
                </motion.p>
              </div>
            </div>
          </Container>
        </Section>

        {/* Category grid */}
        <Section size="sm" id="categories" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              {categories.length === 0 ? (
                <EmptyState
                  icon={<Layers className="h-12 w-12 text-muted-foreground/50" />}
                  title="No categories yet"
                  description="Check back soon as new course categories are being added."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <CategoryCard key={category._id} name={category.name} slug={category.slug} />
                  ))}
                </div>
              )}
            </div>
          </Container>
        </Section>
      </div>
    </>
  );
}