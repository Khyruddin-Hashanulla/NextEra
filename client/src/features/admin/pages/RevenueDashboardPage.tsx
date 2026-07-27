import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { StatCard } from '@/features/admin/components/StatCard';
import { DataTable } from '@/features/admin/components/DataTable';
import { Loader2, DollarSign, TrendingUp, Users, CreditCard, Crown, Star, Wallet } from 'lucide-react';

export function RevenueDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue-dashboard'],
    queryFn: () => adminApi.getRevenueDashboard().then((r) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const w = data?.wallet;

  return (
    <div>
      <AdminHeader title="Revenue Dashboard" description="Comprehensive platform revenue overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Current Balance" value={`₹${(w?.currentBalance || 0).toLocaleString()}`} icon={<Wallet className="h-6 w-6" />} />
        <StatCard title="Total Revenue" value={`₹${(w?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} />
        <StatCard title="Commission Collected" value={`₹${(w?.totalCommissionCollected || 0).toLocaleString()}`} icon={<TrendingUp className="h-6 w-6" />} />
        <StatCard title="Total Payouts" value={`₹${(w?.totalPayoutsMade || 0).toLocaleString()}`} icon={<CreditCard className="h-6 w-6" />} />
        <StatCard title="Pending Payouts" value={`₹${(w?.pendingPayouts || 0).toLocaleString()}`} icon={<Wallet className="h-6 w-6" />} />
        <StatCard title="Active Subscriptions" value={data?.activeInstructorSubscriptions || 0} icon={<Crown className="h-6 w-6" />} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Active Promotions" value={data?.activePromotions || 0} icon={<Star className="h-6 w-6" />} />
        <StatCard title="Instructor Sub Revenue" value={`₹${(data?.instructorSubscriptionRevenue || 0).toLocaleString()}`} icon={<Crown className="h-6 w-6" />} />
        <StatCard title="Promotion Revenue" value={`₹${(data?.featuredPromotionRevenue || 0).toLocaleString()}`} icon={<Star className="h-6 w-6" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Revenue by Source</h3>
          <div className="rounded-lg border">
            {data?.revenueBySource?.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between border-b px-4 py-3 last:border-0">
                <span className="font-medium capitalize">{s._id}</span>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-muted-foreground">{s.count} sales</span>
                  <span>₹{s.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground">Commission: ₹{s.commission.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Monthly Trend (Last 12)</h3>
          <div className="rounded-lg border">
            {data?.monthlyTrend?.map((m: any) => (
              <div key={m._id} className="flex items-center justify-between border-b px-4 py-3 last:border-0">
                <span className="font-medium">{m._id}</span>
                <div className="flex items-center gap-6 text-sm">
                  <span>₹{m.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground">Comm: ₹{m.commission.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data?.topInstructors && data.topInstructors.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Top Earning Instructors</h3>
          <DataTable
            columns={[
              { key: 'instructor', header: 'Instructor', render: (item: any) => (
                <div className="flex items-center gap-2">
                  {item.instructor?.avatar?.url ? (
                    <img src={item.instructor.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {item.instructor?.name?.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium">{item.instructor?.name}</span>
                </div>
              )},
              { key: 'totalPaid', header: 'Total Paid', render: (item: any) => `₹${item.totalPaid.toLocaleString()}` },
            ]}
            data={data.topInstructors}
          />
        </div>
      )}

      {data?.dailyRevenue && data.dailyRevenue.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Daily Revenue (Last 30 days)</h3>
          <DataTable
            columns={[
              { key: 'date', header: 'Date', render: (item: any) => new Date(item._id).toLocaleDateString() },
              { key: 'amount', header: 'Revenue', render: (item: any) => `₹${item.amount.toLocaleString()}` },
              { key: 'count', header: 'Transactions' },
            ]}
            data={data.dailyRevenue}
          />
        </div>
      )}
    </div>
  );
}
