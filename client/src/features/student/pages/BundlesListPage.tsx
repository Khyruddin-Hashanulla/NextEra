import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, BookOpen, Clock, ChevronRight } from 'lucide-react';

export function BundlesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-bundles'],
    queryFn: () => studentApi.listBundles({ limit: 20 }).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bundles = data?.bundles || [];

  if (bundles.length === 0) {
    return (
      <div className="py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No bundles available</h2>
        <p className="mt-2 text-muted-foreground">Check back later for course bundles.</p>
        <Link to="/courses"><Button variant="outline" className="mt-4">Browse Courses</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Bundles</h1>
        <p className="text-muted-foreground">Save money by purchasing courses together</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle: any) => {
          const displayPrice = bundle.discountedPrice > 0 ? bundle.discountedPrice : bundle.price;
          const originalPrice = bundle.discountedPrice > 0 ? bundle.price : null;
          const savings = originalPrice ? originalPrice - displayPrice : 0;

          return (
            <Card key={bundle._id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
              {bundle.thumbnail?.url && (
                <div className="h-40 overflow-hidden">
                  <img src={bundle.thumbnail.url} alt={bundle.title} className="h-full w-full object-cover" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="mb-1">Bundle</Badge>
                </div>
                <CardTitle className="line-clamp-2 text-lg">{bundle.title}</CardTitle>
                {bundle.shortDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{bundle.shortDescription}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {bundle.courses?.length || 0} courses</span>
                  {bundle.totalLectures > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {bundle.totalLectures} lectures</span>}
                </div>

                {bundle.tags?.slice(0, 3).map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="mr-1">{tag}</Badge>
                ))}
              </CardContent>
              <div className="flex items-center justify-between border-t p-4">
                <div>
                  {originalPrice ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold">${displayPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
                      <Badge variant="secondary" className="text-xs">-{Math.round((savings / originalPrice) * 100)}%</Badge>
                    </div>
                  ) : (
                    <span className="text-lg font-bold">${displayPrice}</span>
                  )}
                </div>
                <Link to={`/student/bundles/${bundle._id}`}>
                  <Button size="sm" variant="outline">
                    View <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
