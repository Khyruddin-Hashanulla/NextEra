import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useState } from 'react';

export function WalletPage() {
  const [txPage, setTxPage] = useState(1);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['admin-wallet'],
    queryFn: () => adminApi.getWallet().then((r) => r.data.data),
   });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['admin-wallet-transactions', txPage],
    queryFn: () => adminApi.getWalletTransactions({ page: txPage, limit: 10 }).then((r) => r.data.data),
   });

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Current Balance', value: `$${wallet?.currentBalance?.toFixed(2) || '0.00'}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Revenue', value: `$${wallet?.totalRevenue?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Commission Collected', value: `$${wallet?.totalCommissionCollected?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Payouts Made', value: `$${wallet?.totalPayoutsMade?.toFixed(2) || '0.00'}`, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Pending Payouts', value: `$${wallet?.pendingPayouts?.toFixed(2) || '0.00'}`, icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Wallet</h1>
        <p className="text-muted-foreground">Monitor revenue, commissions, and payouts</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent successful payments</CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Item</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium text-right">Commission</th>
                      <th className="pb-3 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions?.payments?.map((tx: any) => (
                      <tr key={tx._id} className="border-b last:border-0">
                        <td className="py-3">{tx.user?.name || 'N/A'}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">{tx.type}</span>
                        </td>
                        <td className="py-3">{tx.course?.title || tx.bundle?.title || tx.subscription?.name || 'N/A'}</td>
                        <td className="py-3 text-right">${tx.amount?.toFixed(2)}</td>
                        <td className="py-3 text-right">${tx.totalCommissionAmount?.toFixed(2)}</td>
                        <td className="py-3 text-right text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!transactions?.payments || transactions.payments.length === 0) && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {transactions && transactions.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Page {txPage} of {transactions.totalPages}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={txPage <= 1} onClick={() => setTxPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={txPage >= (transactions?.totalPages || 1)} onClick={() => setTxPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
