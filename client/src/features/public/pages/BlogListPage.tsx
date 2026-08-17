import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { blogApi } from '@/api/endpoints/blog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Section, Container } from '@/components/common/Section';
import { PageTransition } from '@/components/common/PageTransition';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { BlogCard } from '@/features/public/components/blog/BlogCard';
import { BlogGridSkeleton } from '@/features/public/components/blog/BlogCardSkeleton';
import type { BlogPost } from '@/types/blog';

const CATEGORIES = ['All', 'Technology', 'Design', 'Business', 'Career', 'Learning Tips'];

const SORT_LABELS: Record<string, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  popular: 'Most Popular',
};

export function BlogListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  const { data: featuredData } = useQuery({
    queryKey: ['blog-featured'],
    queryFn: ({ signal }) => blogApi.getFeatured(3, signal).then((r) => r.data.blogs),
  });

  const {
    data: blogsData,
    isLoading: blogsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['blog-list', page, search, category, sort],
    queryFn: ({ signal }) =>
      blogApi
        .listPublished(
          {
            page,
            limit: 6,
            search: search || undefined,
            category: category === 'All' ? undefined : category,
          } as Parameters<typeof blogApi.listPublished>[0] & Record<string, unknown>,
          signal
        )
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const allBlogs = useMemo(() => {
    if (!blogsData?.blogs) return [];
    return blogsData.blogs;
  }, [blogsData]);

  const featured = featuredData || [];
  const pagination = blogsData?.pagination;
  const totalPages = pagination?.pages || 1;
  const totalArticles = pagination?.total ?? allBlogs.length;

  const isLoading = blogsLoading && page === 1;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters = search || category !== 'All' || sort !== 'newest';

  const bigFeatured = featured[0];
  const smallFeatured = featured.slice(1, 3);
  const bigFeaturedAuthor = bigFeatured?.author?.name || 'NextEra';

  return (
    <PageTransition>
      <SEO
        title="Blog"
        description="Insights, tutorials, and stories from the NextEra learning community."
        canonical="/blog"
      />
      <StructuredData
        schemas={[
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        ]}
      />
      <div className="min-h-screen">
        {/* Page Header */}
        <Section size="sm" background="gradient">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-heading-lg font-semibold text-foreground"
              >
                NextEra Blog
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 text-body-lg text-muted-foreground"
              >
                Insights, tutorials, and stories from the learning community.
              </motion.p>
            </div>
          </Container>
        </Section>

        {/* Featured Articles */}
        {featured.length > 0 && !search && category === 'All' && page === 1 && (
          <Section size="md">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-8 text-2xl font-bold text-foreground">Featured Articles</h2>
                <div className="flex flex-col gap-6 lg:flex-row">
                  <Link to={`/blog/${bigFeatured.slug}`} className="lg:w-2/3">
                    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                      <div className="relative aspect-video w-full overflow-hidden bg-muted lg:aspect-auto lg:h-72">
                        <OptimizedImage
                          src={bigFeatured.featuredImage?.url || '/images/blog.jpg'}
                          alt={`${bigFeatured.title} featured image`}
                          placeholderType="blog"
                          fallbackSrc="/images/blog.jpg"
                          containerClassName="h-full w-full"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40"
                          aria-hidden="true"
                        />

                        {bigFeatured.categories && bigFeatured.categories.length > 0 && (
                          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                            {bigFeatured.categories.slice(0, 2).map((cat) => (
                              <Badge
                                key={cat}
                                variant="secondary"
                                className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
                              >
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div
                          className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                          aria-hidden="true"
                        >
                          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25">
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                            Read Article
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                        <div className="space-y-2">
                          <h3 className="line-clamp-2 break-words text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                            {bigFeatured.title}
                          </h3>
                          {bigFeatured.excerpt && (
                            <p className="line-clamp-2 text-sm text-muted-foreground sm:line-clamp-3">
                              {bigFeatured.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                              <AvatarImage
                                src={bigFeatured.author?.avatar?.url}
                                alt={`Profile photo of ${bigFeaturedAuthor}`}
                              />
                              <AvatarFallback className="bg-muted text-xs font-semibold text-primary">
                                {getInitials(bigFeaturedAuthor)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col text-xs">
                              <span className="truncate font-medium text-foreground">{bigFeaturedAuthor}</span>
                              <span className="truncate text-muted-foreground">
                                {formatDate(bigFeatured.publishedAt || bigFeatured.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span>{bigFeatured.readingTime} min read</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                  <div className="flex flex-col gap-6 lg:w-1/3">
                    {smallFeatured.map((blog) => (
                      <BlogCard key={blog._id} blog={blog} />
                    ))}
                  </div>
                </div>
              </motion.div>
            </Container>
          </Section>
        )}

        {/* Discovery Toolbar & Articles */}
        <Section size="lg" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <label htmlFor="blog-search" className="label-base">
                    Search Articles
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="blog-search"
                      type="search"
                      placeholder="Search articles..."
                      value={search}
                      onChange={handleSearch}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="blog-sort" className="label-base">
                    Sort By
                  </label>
                  <Select value={sort} onValueChange={handleSortChange}>
                    <SelectTrigger id="blog-sort" className="w-full md:w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Categories */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="mr-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Categories
                </span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      category === cat
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Active filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    Active filters
                  </span>
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      "{search}"
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                  {sort !== 'newest' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSort('newest');
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      {SORT_LABELS[sort]}
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                    <Filter className="h-4 w-4" aria-hidden="true" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{totalArticles} articles</span> found
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <BlogGridSkeleton count={6} />
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ErrorState
                    title="Failed to load blog posts"
                    message="Please try again or check your connection."
                    onRetry={() => refetch()}
                  />
                </motion.div>
              ) : allBlogs.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <EmptyState
                    icon={<BookOpen className="h-12 w-12 text-muted-foreground/50" />}
                    title="No articles found"
                    description="Try adjusting your search or filters to find what you're looking for."
                    action={{ label: 'Clear Filters', variant: 'outline', onClick: clearFilters }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {allBlogs.map((blog: BlogPost, index: number) => (
                    <motion.div
                      key={blog._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="h-full"
                    >
                      <BlogCard blog={blog} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {totalPages > 1 && !isLoading && allBlogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 flex justify-center"
              >
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  showPageNumbers
                  siblingCount={1}
                />
              </motion.div>
            )}
          </Container>
        </Section>
      </div>
    </PageTransition>
  );
}