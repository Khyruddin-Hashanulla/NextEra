import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, BookOpen, GraduationCap, DollarSign } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statCards = [
  { key: 'users', label: 'Total Users', icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', subKey: 'total' },
  { key: 'courses', label: 'Total Courses', icon: BookOpen, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', subKey: 'total' },
  { key: 'enrollments', label: 'Total Enrollments', icon: GraduationCap, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'revenue', label: 'Total Revenue', icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', prefix: '₹' },
];

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: ({ signal }) => adminApi.getDashboard(signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your platform</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          let value: string | number = 0;
          if (stat.key === 'users') value = stats?.users?.total || 0;
          else if (stat.key === 'courses') value = stats?.courses?.total || 0;
          else if (stat.key === 'enrollments') value = stats?.enrollments || 0;
          else if (stat.key === 'revenue') value = `${stat.prefix || ''}${(stats?.revenue || 0).toLocaleString()}`;
          return (
            <Card key={stat.key} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <DollarSign className="h-5 w-5 text-green-600" /> Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-green-600">
              ₹{(stats?.revenue || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats?.users?.students || 0} students · {stats?.users?.instructors || 0} instructors · {stats?.users?.admins || 0} admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-5 w-5 text-orange-600" /> Courses Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-orange-600">
              {stats?.courses?.total || 0} total
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats?.courses?.published || 0} published · {stats?.courses?.pending || 0} pending review
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.recentUsers?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No recent users</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.recentUsers.map((user: any) => (
                      <tr key={user._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.recentPayments?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <DollarSign className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No recent payments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.recentPayments.map((payment: any) => (
                      <tr key={payment._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">{payment.user?.name || 'N/A'}</td>
                        <td className="px-4 py-3 font-medium">₹{payment.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            payment.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>{payment.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
