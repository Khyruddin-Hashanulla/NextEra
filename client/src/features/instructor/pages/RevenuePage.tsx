import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, ShoppingCart, ArrowRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statCards = [
  { key: 'total', label: 'Total Revenue', icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', prefix: '₹' },
  { key: 'monthly', label: 'Monthly Revenue', icon: TrendingUp, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', prefix: '₹' },
  { key: 'sales', label: 'Total Sales', icon: ShoppingCart, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', prefix: '' },
];

export function RevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'revenue'],
    queryFn: () => instructorApi.getRevenue().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const monthlyRevenue = data?.daily?.slice(-30).reduce((s: number, d: any) => s + d.amount, 0) || 0;
  const totalSales = data?.daily?.reduce((s: number, d: any) => s + d.count, 0) || 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="mt-1 text-muted-foreground">Your earnings from courses</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => {
          let value: string | number = 0;
          if (stat.key === 'total') value = data?.total || 0;
          else if (stat.key === 'monthly') value = monthlyRevenue;
          else if (stat.key === 'sales') value = totalSales;
          return (
            <Card key={stat.key} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.prefix}{(value as number).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {data?.perCourse && data.perCourse.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Earnings by Course</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Enrollments</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.perCourse.map((course: any) => (
                      <tr key={course._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{course.courseTitle}</td>
                        <td className="px-4 py-3">{course.enrollments}</td>
                        <td className="px-4 py-3">₹{course.amount.toLocaleString()}</td>
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
