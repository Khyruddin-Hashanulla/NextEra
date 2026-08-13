import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Plus, Search, Users, MousePointerClick, ShoppingCart, DollarSign } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/ListSkeleton';

export function AffiliatesPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    user: '',
    code: '',
    commissionPercent: 10,
    payoutMethod: 'bank',
    payoutDetails: {} as any,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliates', page, search],
    queryFn: ({ signal }) => adminApi.listAffiliates({ page, limit: 10, search }, signal).then((r) => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-affiliate-stats'],
    queryFn: ({ signal }) => adminApi.getAffiliateStats(signal).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => adminApi.createAffiliate(d as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      addToast({ title: 'Affiliate created', variant: 'success' });
      setOpen(false);
    },
    onError: (err: any) => addToast({ title: err?.response?.data?.message || 'Create failed', variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: any }) => adminApi.updateAffiliate(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      addToast({ title: 'Affiliate updated', variant: 'success' });
    },
    onError: () => addToast({ title: 'Update failed', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAffiliate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      addToast({ title: 'Affiliate deleted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Delete failed', variant: 'error' }),
  });

  return (
    <div className="space-y-6">
      <AdminHeader title="Affiliates" description="Manage affiliate program" />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalClicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalConversions}</p>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">₹{(stats.totalEarnings || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Affiliate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Affiliate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User ID</Label>
                <Input
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  placeholder="User ID"
                />
              </div>
              <div>
                <Label>Affiliate Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PROMO10"
                />
              </div>
              <div>
                <Label>Commission % (1-50)</Label>
                <Input
                  type="number"
                  value={form.commissionPercent}
                  onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Payout Method</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.payoutMethod}
                  onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })}
                >
                  <option value="bank">Bank</option>
                  <option value="paypal">PayPal</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.user || !form.code}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} hasHeader={false} />
      ) : (
        <DataTable
          columns={[
            {
              key: 'user',
              header: 'User',
              render: (item: any) => (
                <div className="flex items-center gap-2">
                  {item.user?.avatar?.url ? (
                    <OptimizedImage
                      src={item.user.avatar.url}
                      alt={item.user?.name || 'User'}
                      placeholderType="avatar"
                      className="rounded-full object-cover"
                      containerClassName="h-7 w-7"
                    />
                  ) : null}
                  <span className="font-medium">{item.user?.name || 'N/A'}</span>
                </div>
              ),
            },
            {
              key: 'code',
              header: 'Code',
              render: (item: any) => <span className="font-mono font-bold">{item.code}</span>,
            },
            { key: 'commissionPercent', header: 'Commission', render: (item: any) => `${item.commissionPercent}%` },
            { key: 'totalClicks', header: 'Clicks' },
            { key: 'totalConversions', header: 'Conversions' },
            {
              key: 'totalEarnings',
              header: 'Earnings',
              render: (item: any) => `₹${(item.totalEarnings || 0).toLocaleString()}`,
            },
            {
              key: 'status',
              header: 'Status',
              render: (item: any) => (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {item.status}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (item: any) => (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: item._id,
                        data: { status: item.status === 'active' ? 'inactive' : 'active' },
                      })
                    }
                  >
                    {item.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(item._id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={data?.affiliates || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No affiliates found"
        />
      )}
    </div>
  );
}
