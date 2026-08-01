import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { blogApi } from '@/api/endpoints/blog';
import { BlogGridSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Section, Container } from '@/components/common/Section';
import { PageTransition } from '@/components/common/PageTransition';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbListSchema } from '@/lib/schema';
import {
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  ArrowRight,
  X,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { BlogPost } from '@/types/blog';

const CATEGORIES = ['All', 'Technology', 'Design', 'Business', 'Career', 'Learning Tips'];

export function BlogListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['blog-featured'],
    queryFn: ({ signal }) => blogApi.getFeatured(3, signal).then((r) => r.data.blogs),
  });

  const { data: blogsData, isLoading: blogsLoading, error, refetch } = useQuery({
    queryKey: ['blog-list', page, search, category, sort],
    queryFn: ({ signal }) =>
      blogApi.listPublished({
        page,
        limit: 6,
        search: search || undefined,
        category: category === 'All' ? undefined : category,
      } as Parameters<typeof blogApi.listPublished>[0] & Record<string, unknown>, signal).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const allBlogs = useMemo(() => {
    if (!blogsData?.blogs) return [];
    return blogsData.blogs;
  }, [blogsData]);

  const featured = featuredData || [];
  const pagination = blogsData?.pagination;
  const totalPages = pagination?.pages || 1;

  const isLoading = blogsLoading && page === 1;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
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

  return (
    <PageTransition>
      <SEO title="Blog" description="Insights, tutorials, and stories from the NextEra learning community." canonical="/blog" />
      <StructuredData schemas={[
        breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ]),
      ]} />
      <div className="min-h-screen">
        <Section size="sm" className="bg-gradient-to-br from-primary/10 via-background to-background">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                NextEra Blog
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Insights, tutorials, and stories from the learning community.
              </p>
            </motion.div>
          </Container>
        </Section>

        {featured.length > 0 && !search && category === 'All' && page === 1 && (
          <Section size="md">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-8">Featured Articles</h2>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-2/3">
                    <Link to={`/blog/${bigFeatured.slug}`}>
                      <article className="rounded-2xl bg-background border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                        <div className="h-64 overflow-hidden">
                          <OptimizedImage
                            src={bigFeatured.featuredImage?.url || '/placeholder-blog.jpg'}
                            alt={`${bigFeatured.title} featured image`}
                            placeholderType="blog"
                            className="object-cover"
                          />
                        </div>
                        <div className="p-5">
                          <span className="text-xs text-muted-foreground/70">{formatDate(bigFeatured.publishedAt || bigFeatured.createdAt)}</span>
                          <div className="mt-2">
                            {bigFeatured.categories?.slice(0, 1).map((cat) => (
                              <span
                                key={cat}
                                className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block mb-2"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                          <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors text-lg">
                            {bigFeatured.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {bigFeatured.excerpt}
                          </p>
                          <span className="text-xs text-muted-foreground/70 mt-3 block">
                            {bigFeatured.readingTime} min read
                          </span>
                        </div>
                      </article>
                    </Link>
                  </div>
                  <div className="lg:w-1/3 flex flex-col gap-6">
                    {smallFeatured.map((blog) => (
                      <Link key={blog._id} to={`/blog/${blog.slug}`}>
                        <article className="rounded-2xl bg-background border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1">
                          <div className="h-40 overflow-hidden">
                            <OptimizedImage
                              src={blog.featuredImage?.url || '/placeholder-blog.jpg'}
                              alt={`${blog.title} featured image`}
                              placeholderType="blog"
                              className="object-cover"
                            />
                          </div>
                          <div className="p-5">
                            <span className="text-xs text-muted-foreground/70">{formatDate(blog.publishedAt || blog.createdAt)}</span>
                            <div className="mt-2">
                              {blog.categories?.slice(0, 1).map((cat) => (
                                <span
                                  key={cat}
                                  className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block mb-2"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                            <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
                              {blog.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {blog.excerpt}
                            </p>
                            <span className="text-xs text-muted-foreground/70 mt-3 block">
                              {blog.readingTime} min read
                            </span>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Container>
          </Section>
        )}

        <Section size="md" background="muted">
          <Container>
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-64 flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-24 space-y-6"
                >
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        placeholder="Search articles..."
                        value={search}
                        onChange={handleSearch}
                        className="pl-9 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground/80 mb-3">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                            category === cat
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground/80 mb-3">Sort By</p>
                    <Select value={sort} onValueChange={(value) => { setSort(value); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </motion.div>
              </aside>

              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <BlogGridSkeleton count={6} />
                ) : error ? (
                  <ErrorState
                    title="Failed to load blog posts"
                    message="Please try again or check your connection."
                    onRetry={() => refetch()}
                  />
                ) : (
                  <AnimatePresence mode="wait">
                    {allBlogs.length === 0 ? (
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
                          action={{ label: 'Clear Filters', href: '/blog', variant: 'outline' }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                      >
                        {allBlogs.map((blog: BlogPost, index: number) => (
                          <motion.div
                            key={blog._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            <Link to={`/blog/${blog.slug}`}>
                              <article className="rounded-2xl bg-background border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                                <div className="h-48 overflow-hidden">
                                  <OptimizedImage
                                    src={blog.featuredImage?.url || '/placeholder-blog.jpg'}
                                    alt={`${blog.title} featured image`}
                                    placeholderType="blog"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="p-5">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
                                    <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                                    {blog.categories?.slice(0, 1).map((cat) => (
                                      <span
                                        key={cat}
                                        className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full"
                                      >
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                  <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
                                    {blog.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {blog.excerpt}
                                  </p>
                                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                                    {blog.author?.avatar?.url ? (
                                      <OptimizedImage
                                        src={blog.author.avatar.url}
                                        alt={`Profile photo of ${blog.author.name}`}
                                        placeholderType="avatar"
                                        className="rounded-full object-cover"
                                        containerClassName="h-6 w-6"
                                      />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-muted" />
                                    )}
                                    <span className="text-sm text-muted-foreground">{blog.author?.name}</span>
                                    <span className="text-xs text-muted-foreground/70">{blog.readingTime} min read</span>
                                  </div>
                                </div>
                              </article>
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

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
              </div>
            </div>
          </Container>
        </Section>
      </div>
    </PageTransition>
  );
}
