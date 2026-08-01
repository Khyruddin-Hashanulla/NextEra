import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, UserCheck } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function InstructorsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: instructors, isLoading } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: ({ signal }) => adminApi.getPendingInstructors(signal).then((r) => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveInstructor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      addToast({ title: 'Instructor approved', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to approve', variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectInstructor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      addToast({ title: 'Instructor rejected', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to reject', variant: 'error' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-80" /></div>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Applied</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {instructors.map((inst: any) => (
                      <tr key={inst._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{inst.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inst.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(inst.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(inst._id)}
                              loading={approveMutation.isPending}
                            >
                              <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectMutation.mutate(inst._id)}
                              loading={rejectMutation.isPending}
                              className="text-destructive"
                            >
                              <XCircle className="mr-1.5 h-4 w-4" /> Reject
                            </Button>
                          </div>
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
    </motion.div>
  );
}
