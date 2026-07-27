import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Star, Users, Clock, BookOpen } from 'lucide-react';

export function CoursesPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'courses', search, level, page],
    queryFn: () => studentApi.listCourses({ search, level: level || undefined, page, limit: 12 }).then((r: any) => r.data.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground">Discover courses and start learning</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search courses..."
            className="pl-9"
          />
        </div>
        <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !data?.courses?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No courses found. Try adjusting your search.</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.courses.map((course: any) => (
              <Card key={course._id} className="overflow-hidden transition-shadow hover:shadow-md">
                <Link to={`/student/courses/${course._id}`}>
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {course.thumbnail?.url ? (
                      <img src={course.thumbnail.url} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen className="h-8 w-8" /></div>
                    )}
                  </div>
                </Link>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-base">
                    <Link to={`/student/courses/${course._id}`} className="hover:text-primary">{course.title}</Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{course.instructor?.name || 'Unknown'}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {course.averageRating > 0 && (
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{course.averageRating}</span>
                    )}
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.totalEnrollments}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.totalDuration || 0}h</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold">₹{course.price === 0 ? 'Free' : course.price.toLocaleString()}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{course.level}</span>
                  </div>
                  <Link to={`/student/courses/${course._id}`}>
                    <Button className="mt-3 w-full" size="sm">View Course</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
