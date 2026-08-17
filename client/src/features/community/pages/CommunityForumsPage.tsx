import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, MessageCircle, MessagesSquare, Plus, Search, Users } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';
import { ROUTES } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import {
  useForumCategories,
  useForumStats,
  useForumTopics,
} from '@/features/community/hooks/useCommunity';
import { TopicCard } from '@/features/community/components/TopicCard';
import { CategorySidebar } from '@/features/community/components/CategorySidebar';
import { CreateTopicDialog } from '@/features/community/components/CreateTopicDialog';
import { ForumFeedSkeleton } from '@/features/community/components/CommunitySkeleton';
import type { ForumCategorySlug, ForumSort } from '@/types/community';

const SORTS: { value: ForumSort; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'active', label: 'Most Active' },
  { value: 'viewed', label: 'Most Viewed' },
  { value: 'discussed', label: 'Most Discussed' },
  { value: 'trending', label: 'Trending' },
];

export function CommunityForumsPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const category = searchParams.get('category') ?? undefined;
  const sort = (searchParams.get('sort') ?? 'latest') as ForumSort;
  const solvedParam = searchParams.get('solved');
  const instructorParam = searchParams.get('instructor');
  const search = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput.trim() || undefined });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateParams(next: Record<string, string | undefined>) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(next)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      params.delete('page');
      return params;
    });
  }

  const setPage = (nextPage: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (nextPage <= 1) params.delete('page');
      else params.set('page', String(nextPage));
      return params;
    });
  };

  const filters = {
    page,
    limit: 10,
    sort,
    category: (category as ForumCategorySlug) || undefined,
    search: search || undefined,
    solved: solvedParam === 'true' ? true : solvedParam === 'false' ? false : undefined,
    instructor: instructorParam === 'true' ? true : undefined,
  };

  const topicsQuery = useForumTopics(filters);
  const categoriesQuery = useForumCategories();
  const statsQuery = useForumStats();

  const discussions = topicsQuery.data?.discussions ?? [];
  const pagination = topicsQuery.data?.pagination;
  const categories = categoriesQuery.data ?? [];
  const stats = statsQuery.data;

  const hasActiveFilters = Boolean(category || search || solvedParam || instructorParam);

  const handleStartDiscussion = () => {
    if (isAuthenticated) {
      setDialogOpen(true);
    }
  };

  const statsItems = [
    { label: 'Members', value: stats?.members, icon: Users },
    { label: 'Discussions', value: stats?.discussions, icon: MessagesSquare },
    { label: 'Replies', value: stats?.replies, icon: MessageCircle },
  ];

  return (
    <>
      <SEO
        title="Community Forums"
        description="Join the NextEra community to ask questions, share knowledge, and learn together with students and instructors."
        canonical="/community"
      />
      <StructuredData
        schemas={[
          webPageSchema({
            name: 'Community Forums',
            description: 'Join the NextEra community to ask questions, share knowledge, and learn together.',
            path: '/community',
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Community Forums', path: '/community' },
          ]),
        ]}
      />

      <div className="min-h-screen overflow-x-clip">
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
                  <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  Community Forums
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Learn together. Ask anything.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Connect with instructors and learners across NextEra. Share what you&apos;re building, ask questions,
                  and grow together.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <div className="relative w-full sm:max-w-md">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      aria-label="Search discussions"
                      placeholder="Search discussions…"
                      className="h-12 rounded-full border-border/60 bg-background/70 pl-11 pr-4 shadow-sm backdrop-blur-sm"
                    />
                  </div>
                  {isAuthenticated ? (
                    <Button size="lg" className="shrink-0 gap-2 rounded-full" onClick={handleStartDiscussion}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Start a Discussion
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="shrink-0 gap-2 rounded-full">
                      <Link to={ROUTES.LOGIN}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Start a Discussion
                      </Link>
                    </Button>
                  )}
                </motion.div>

                <motion.dl
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mt-10 flex max-w-xl flex-wrap gap-x-8 gap-y-4"
                >
                  {statsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/60">
                          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                        </span>
                        <div>
                          <dt className="sr-only">{item.label}</dt>
                          <dd className="text-heading-sm font-bold tabular-nums text-foreground">
                            {item.value === undefined ? <Skeleton className="h-6 w-14" /> : formatNumber(item.value)}
                          </dd>
                          <dd className="text-xs text-muted-foreground">{item.label}</dd>
                        </div>
                      </div>
                    );
                  })}
                </motion.dl>
              </div>
            </div>
          </Container>
        </Section>

        <Section size="sm" id="content" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
                <aside className="hidden lg:block">
                  <div className="sticky top-24 rounded-2xl border border-border/60 bg-card/40 p-3 backdrop-blur-sm">
                    <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Browse topics
                    </p>
                    {categoriesQuery.isLoading ? (
                      <div className="space-y-2 px-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Skeleton key={index} className="h-9 w-full" />
                        ))}
                      </div>
                    ) : (
                      <CategorySidebar
                        categories={categories}
                        activeCategory={category}
                        onSelect={(slug) => updateParams({ category: slug })}
                      />
                    )}
                  </div>
                </aside>

                <div className="min-w-0">
                  {categoriesQuery.isLoading ? null : (
                    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden" aria-label="Forum categories">
                      <button
                        type="button"
                        onClick={() => updateParams({ category: undefined })}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          !category
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        All
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => updateParams({ category: c.slug })}
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            category === c.slug
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
                      <SelectTrigger className="w-44" aria-label="Sort discussions">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORTS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={solvedParam ?? 'all'}
                      onValueChange={(value) =>
                        updateParams({ solved: value === 'all' ? undefined : value })
                      }
                    >
                      <SelectTrigger className="w-36" aria-label="Filter by solved status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All posts</SelectItem>
                        <SelectItem value="false">Open</SelectItem>
                        <SelectItem value="true">Solved</SelectItem>
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => updateParams({ instructor: instructorParam === 'true' ? undefined : 'true' })}
                      aria-pressed={instructorParam === 'true'}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                        instructorParam === 'true'
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                      Instructors only
                    </button>
                  </div>

                  {topicsQuery.isLoading ? (
                    <ForumFeedSkeleton />
                  ) : topicsQuery.isError ? (
                    <ErrorState
                      title="Couldn't load discussions"
                      message="We ran into a problem fetching the community feed."
                      onRetry={() => topicsQuery.refetch()}
                      showHomeLink={false}
                    />
                  ) : discussions.length === 0 ? (
                    hasActiveFilters ? (
                      <EmptyState
                        icon={<Search className="h-6 w-6 text-muted-foreground" />}
                        title="No discussions found"
                        description="Try adjusting your search or filters, or start a new discussion."
                        action={{
                          label: 'Clear filters',
                          onClick: () =>
                            setSearchParams((prev) => {
                              const params = new URLSearchParams(prev);
                              params.delete('category');
                              params.delete('search');
                              params.delete('solved');
                              params.delete('instructor');
                              params.delete('page');
                              return params;
                            }),
                        }}
                      />
                    ) : (
                      <EmptyState
                        icon={<MessagesSquare className="h-6 w-6 text-muted-foreground" />}
                        title="No discussions yet"
                        description="Be the first to start a conversation in the NextEra community."
                        action={
                          isAuthenticated
                            ? { label: 'Start the first discussion', onClick: handleStartDiscussion }
                            : { label: 'Start the first discussion', href: ROUTES.LOGIN }
                        }
                      />
                    )
                  ) : (
                    <div className="space-y-4">
                      {discussions.map((topic) => (
                        <TopicCard key={topic._id} topic={topic} />
                      ))}
                    </div>
                  )}

                  {pagination && pagination.pages > 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      onPageChange={setPage}
                      className="mt-8 justify-center"
                    />
                  )}
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <CreateTopicDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          categories={categories}
          defaultCategory={(category as ForumCategorySlug) || undefined}
        />
      </div>
    </>
  );
}