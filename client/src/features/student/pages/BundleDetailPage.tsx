import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CourseDetailSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { ErrorState } from '@/components/common/ErrorState';
import { categorizeError } from '@/lib/error-utils';
import { Clock, BookOpen, Star, User, ArrowLeft, Zap } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export function BundleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['bundle', id],
    queryFn: () => studentApi.getBundleById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !data) {
    if (!data && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="bundle" />;
    }
    const category = categorizeError(error);
    if (category === 'network') {
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
        title="Bundle Not Found"
        message="This bundle doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const bundle = data;
  const displayPrice = bundle.discountedPrice > 0 ? bundle.discountedPrice : bundle.price;
  const originalPrice = bundle.discountedPrice > 0 ? bundle.price : null;
  const savings = originalPrice ? originalPrice - displayPrice : 0;

  return (
    <div className="py-6">
      <Link to="/courses" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Courses
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Badge className="mb-2">Bundle</Badge>
            <h1 className="text-3xl font-bold">{bundle.title}</h1>
            {bundle.shortDescription && (
              <p className="mt-2 text-muted-foreground">{bundle.shortDescription}</p>
            )}
          </div>

          {bundle.description && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground whitespace-pre-line">{bundle.description}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">Courses in this Bundle ({bundle.courses?.length || 0})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {bundle.courses?.map((course: any) => (
                <Link key={course._id} to={`/courses/${course._id}`} className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent">
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {course.thumbnail?.url ? (
                      <OptimizedImage src={course.thumbnail.url} alt={course.title} placeholderType="course" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {course.instructor?.name && `By ${course.instructor.name}`}
                      {course.totalDuration && ` \u00b7 ${Math.round(course.totalDuration / 60)}h`}
                    </p>
                    {course.averageRating > 0 && (
                      <p className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star className="h-3 w-3 fill-current" /> {course.averageRating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {bundle.tags && bundle.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bundle.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              {bundle.thumbnail?.url && (
                <div className="overflow-hidden rounded-lg">
                  <OptimizedImage src={bundle.thumbnail.url} alt={bundle.title} placeholderType="course" className="object-cover w-full" />
                </div>
              )}

              <div>
                {originalPrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${displayPrice}</span>
                    <span className="text-lg text-muted-foreground line-through">${originalPrice}</span>
                    <Badge variant="secondary">Save ${savings}</Badge>
                  </div>
                ) : (
                  <span className="text-3xl font-bold">${displayPrice}</span>
                )}
              </div>

              <Button className="w-full gap-2" size="lg">
                <Zap className="h-4 w-4" /> Buy This Bundle
              </Button>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {bundle.courses?.length || 0} Courses</div>
                {bundle.totalLectures > 0 && <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {bundle.totalLectures} Lectures</div>}
                {bundle.totalDuration > 0 && <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {Math.round(bundle.totalDuration / 60)} Hours</div>}
                <div className="flex items-center gap-2"><User className="h-4 w-4" /> {bundle.totalEnrollments} Enrolled</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
