import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Loader2 } from 'lucide-react';

export function PaymentManagementPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, statusFilter],
    queryFn: () => adminApi.listAllPayments({ page, limit: 10, status: statusFilter || undefined }),
   });

  const payments = data?.data?.data?.payments || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'User', accessor: (p: any) => p.user?.name || 'Unknown' },
    { header: 'Type', accessor: (p: any) => <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs capitalize">{p.type}</span> },
    { header: 'Item', accessor: (p: any) => p.course?.title || p.bundle?.title || p.subscription?.name || '-' },
    { header: 'Amount', accessor: (p: any) => <span className="font-medium">₹{p.amount}</span> },
    { header: 'Status', accessor: (p: any) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'success' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
    ) },
    { header: 'Date', accessor: (p: any) => new Date(p.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: (p: any) => (
      <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(p)}><Eye className="h-3 w-3" /></Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment Management</h1>
      <div className="flex gap-2">
        <Button variant={statusFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(''); setPage(1); }}>All</Button>
        <Button variant={statusFilter === 'success' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('success'); setPage(1); }}>Success</Button>
        <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('pending'); setPage(1); }}>Pending</Button>
        <Button variant={statusFilter === 'failed' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('failed'); setPage(1); }}>Failed</Button>
      </div>
      <DataTable columns={columns} data={payments} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader>
          {selectedPayment && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><strong>User:</strong> {selectedPayment.user?.name}</div>
                <div><strong>Email:</strong> {selectedPayment.user?.email}</div>
                <div><strong>Amount:</strong> ₹{selectedPayment.amount}</div>
                <div><strong>Status:</strong> {selectedPayment.status}</div>
                <div><strong>Type:</strong> {selectedPayment.type}</div>
                <div><strong>Currency:</strong> {selectedPayment.currency}</div>
              </div>
              {selectedPayment.razorpayOrderId && <div><strong>Order ID:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selectedPayment.razorpayOrderId}</code></div>}
              {selectedPayment.razorpayPaymentId && <div><strong>Payment ID:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selectedPayment.razorpayPaymentId}</code></div>}
              <div><strong>Date:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
