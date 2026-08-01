import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogApi } from '@/api/endpoints/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, Clock, ChevronLeft, ChevronRight, Bookmark, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Link } from 'react-router-dom';

export function BlogListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: blogsData, isLoading: blogsLoading } = useQuery({
    queryKey: ['public-blogs', page, search, category],
    queryFn: ({ signal }) => blogApi.listPublished({ page, limit: 12, search, category: category || undefined }, signal).then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: ({ signal }) => blogApi.getCategories(signal).then(r => r.data),
  });

  const { data: featuredData } = useQuery({
    queryKey: ['blog-featured'],
    queryFn: ({ signal }) => blogApi.getFeatured(3, signal).then(r => r.data),
  });

  const blogs = blogsData?.blogs || [];
  const pagination = blogsData?.pagination;
  const categories = categoriesData?.categories || [];
  const featured = featuredData?.blogs || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Insights, tutorials, and updates from our team
        </p>
      </div>

      {featured.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((post: any) => (
            <Link key={post._id} to={`/blog/${post.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors overflow-hidden">
                {post.featuredImage?.url && (
                  <div className="aspect-video bg-muted">
                    <OptimizedImage src={post.featuredImage.url} alt={post.title} placeholderType="blog" className="object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <Badge variant="secondary" className="text-xs">Featured</Badge>
                  <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={!category ? 'default' : 'outline'} size="sm" onClick={() => { setCategory(''); setPage(1); }}>All</Button>
          {categories.map((cat: any) => (
            <Button
              key={cat.name}
              variant={category === cat.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setCategory(cat.name); setPage(1); }}
            >
              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {blogsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="mx-auto h-8 w-8 mb-2" />
          <p>No articles found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((post: any) => (
            <Link key={post._id} to={`/blog/${post.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors overflow-hidden">
                {post.featuredImage?.url && (
                  <div className="aspect-video bg-muted">
                    <OptimizedImage src={post.featuredImage.url} alt={post.title} placeholderType="blog" className="object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {post.categories?.slice(0, 2).map((cat: string) => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                    ))}
                    {post.isBookmarked && <Bookmark className="h-3 w-3 text-primary ml-auto" />}
                  </div>
                  <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min</span>
                    </div>
                    {post.author?.name && <span>{post.author.name}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
