import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export function WithdrawRequestsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdraw-requests', page, statusFilter],
    queryFn: ({ signal }) =>
      adminApi.listWithdrawRequests({ page, limit: 10, status: statusFilter || undefined }, signal),
  });

  const payouts = data?.data?.data?.payouts || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    {
      header: 'Instructor',
      accessor: (p: any) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {p.instructor?.avatar?.url ? (
              <OptimizedImage
                src={p.instructor.avatar.url}
                alt={p.instructor?.name || 'Instructor'}
                placeholderType="avatar"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-medium">
                {p.instructor?.name?.[0]}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{p.instructor?.name}</p>
            <p className="text-xs text-muted-foreground">{p.instructor?.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Amount', accessor: (p: any) => <span className="font-medium">₹{p.amount}</span> },
    {
      header: 'Status',
      accessor: (p: any) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
        >
          {p.status}
        </span>
      ),
    },
    { header: 'Date', accessor: (p: any) => new Date(p.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdraw Requests</h1>
      <div className="flex gap-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('pending');
            setPage(1);
          }}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('completed');
            setPage(1);
          }}
        >
          Completed
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={payouts}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
