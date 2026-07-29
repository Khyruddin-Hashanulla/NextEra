import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function StudentManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'students', page, search],
    queryFn: () => instructorApi.getStudents({ page, limit: 10, search }).then((r) => r.data.data),
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">My Students</h1>
        <p className="mt-1 text-muted-foreground">Students enrolled in your courses</p>
      </motion.div>

      <motion.div variants={item} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !data?.students?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No students enrolled yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Students will appear here once they enroll in your courses</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Enrolled</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.students.map((student: any) => (
                      <tr key={student._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.avatar?.url && (
                              <img src={student.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                            )}
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                        <td className="px-4 py-3">{student.courseTitle}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(student.enrollmentDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(student.progress)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round(student.progress)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (data.pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
