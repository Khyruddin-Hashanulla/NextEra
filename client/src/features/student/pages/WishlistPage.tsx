import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Heart, Trash2, BookOpen } from 'lucide-react';

export function WishlistPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: items, isLoading } = useQuery({
    queryKey: ['student', 'wishlist'],
    queryFn: () => studentApi.listWishlist().then((r: any) => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (courseId: string) => studentApi.toggleWishlist(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'wishlist'] });
      addToast({ title: 'Removed from wishlist', variant: 'success' });
    },
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <p className="text-muted-foreground">Courses you've saved for later</p>
      </div>

      {!items?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Your wishlist is empty.</p>
            <Link to="/courses"><Button>Browse Courses</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => (
            <Card key={item._id} className="overflow-hidden">
              <Link to={`/courses/${item.course?._id}`}>
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  {item.course?.thumbnail?.url ? (
                    <img src={item.course.thumbnail.url} alt={item.course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen className="h-8 w-8" /></div>
                  )}
                </div>
              </Link>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-base">
                  <Link to={`/courses/${item.course?._id}`} className="hover:text-primary">{item.course?.title}</Link>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{item.course?.instructor?.name || ''}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">₹{item.course?.price === 0 ? 'Free' : item.course?.price?.toLocaleString()}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{item.course?.level}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={`/courses/${item.course?._id}`} className="flex-1">
                    <Button size="sm" className="w-full">View Course</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => removeMutation.mutate(item.course?._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
