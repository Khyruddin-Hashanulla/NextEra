import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, CreditCard, Wallet, Crown, Star } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statCards = [
  { key: 'currentBalance', label: 'Current Balance', icon: Wallet, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', prefix: '₹' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', prefix: '₹' },
  { key: 'totalCommissionCollected', label: 'Commission Collected', icon: TrendingUp, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', prefix: '₹' },
  { key: 'totalPayoutsMade', label: 'Total Payouts', icon: CreditCard, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', prefix: '₹' },
  { key: 'pendingPayouts', label: 'Pending Payouts', icon: Wallet, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400', prefix: '₹' },
  { key: 'activeInstructorSubscriptions', label: 'Active Subscriptions', icon: Crown, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400' },
];

const secondaryCards = [
  { key: 'activePromotions', label: 'Active Promotions', icon: Star, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'instructorSubscriptionRevenue', label: 'Instructor Sub Revenue', icon: Crown, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', prefix: '₹' },
  { key: 'featuredPromotionRevenue', label: 'Promotion Revenue', icon: Star, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', prefix: '₹' },
];

export function RevenueDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue-dashboard'],
    queryFn: () => adminApi.getRevenueDashboard().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const w = data?.wallet;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Comprehensive platform revenue overview</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => {
          let value: string | number = 0;
          if (stat.key === 'currentBalance') value = `${stat.prefix || ''}${(w?.currentBalance || 0).toLocaleString()}`;
          else if (stat.key === 'totalRevenue') value = `${stat.prefix || ''}${(w?.totalRevenue || 0).toLocaleString()}`;
          else if (stat.key === 'totalCommissionCollected') value = `${stat.prefix || ''}${(w?.totalCommissionCollected || 0).toLocaleString()}`;
          else if (stat.key === 'totalPayoutsMade') value = `${stat.prefix || ''}${(w?.totalPayoutsMade || 0).toLocaleString()}`;
          else if (stat.key === 'pendingPayouts') value = `${stat.prefix || ''}${(w?.pendingPayouts || 0).toLocaleString()}`;
          else if (stat.key === 'activeInstructorSubscriptions') value = data?.activeInstructorSubscriptions || 0;
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

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        {secondaryCards.map((stat) => {
          let value: string | number = 0;
          if (stat.key === 'activePromotions') value = data?.activePromotions || 0;
          else if (stat.key === 'instructorSubscriptionRevenue') value = `${stat.prefix || ''}${(data?.instructorSubscriptionRevenue || 0).toLocaleString()}`;
          else if (stat.key === 'featuredPromotionRevenue') value = `${stat.prefix || ''}${(data?.featuredPromotionRevenue || 0).toLocaleString()}`;
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
            <CardTitle className="text-base font-semibold">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.revenueBySource?.length ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No data available</div>
            ) : (
              <div className="divide-y">
                {data.revenueBySource.map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30">
                    <span className="font-medium capitalize">{s._id}</span>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-muted-foreground">{s.count} sales</span>
                      <span>₹{s.amount.toLocaleString()}</span>
                      <span className="text-muted-foreground">Comm: ₹{s.commission.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Trend (Last 12)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.monthlyTrend?.length ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No data available</div>
            ) : (
              <div className="divide-y">
                {data.monthlyTrend.map((m: any) => (
                  <div key={m._id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30">
                    <span className="font-medium">{m._id}</span>
                    <div className="flex items-center gap-6 text-sm">
                      <span>₹{m.amount.toLocaleString()}</span>
                      <span className="text-muted-foreground">Comm: ₹{m.commission.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {data?.topInstructors && data.topInstructors.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top Earning Instructors</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Instructor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.topInstructors.map((inst: any) => (
                      <tr key={inst._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {inst.instructor?.avatar?.url ? (
                              <img src={inst.instructor.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {inst.instructor?.name?.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium">{inst.instructor?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">₹{inst.totalPaid.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {data?.dailyRevenue && data.dailyRevenue.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Daily Revenue (Last 30 days)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.dailyRevenue.map((d: any) => (
                      <tr key={d._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">{new Date(d._id).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium">₹{d.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">{d.count}</td>
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
