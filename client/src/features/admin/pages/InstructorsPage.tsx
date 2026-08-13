import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { UserCheck, Eye } from 'lucide-react';
import { InstructorApplicationReviewModal } from '../components/InstructorApplicationReviewModal';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function InstructorsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: instructors, isLoading } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: ({ signal }) => adminApi.getPendingInstructors(signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Instructor Applications</h1>
        <p className="mt-1 text-muted-foreground">Review and manage instructor applications</p>
      </motion.div>

      {!instructors?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <UserCheck className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No pending instructor applications</p>
              <p className="mt-1 text-sm text-muted-foreground">All instructor requests have been processed</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Applied
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {instructors.map((inst: any) => (
                      <tr key={inst._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{inst.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inst.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(inst.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(inst._id)}>
                            <Eye className="mr-1.5 h-4 w-4" /> Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <InstructorApplicationReviewModal
        applicationId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </motion.div>
  );
}
