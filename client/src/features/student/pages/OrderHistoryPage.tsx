import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/features/admin/components/DataTable';
import { Loader2, Download, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrderHistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'payments', page],
    queryFn: () => studentApi.listMyPayments({ page, limit: 10 }).then((r: any) => r.data.data),
  });

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const response = await studentApi.generateInvoice(paymentId);
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>
        <p className="text-muted-foreground">View your payment history and download invoices</p>
      </div>

      {!data?.payments?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet.</p>
            <Link to="/courses"><Button>Browse Courses</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'razorpayOrderId', header: 'Order ID', render: (item: any) => <span className="text-xs font-mono">{item.razorpayOrderId?.slice(-12)}</span> },
              { key: 'course', header: 'Course', render: (item: any) => item.course?.title || 'N/A' },
              { key: 'amount', header: 'Amount', render: (item: any) => `₹${item.amount?.toLocaleString()}` },
              {
                key: 'status',
                header: 'Status',
                render: (item: any) => (
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    item.status === 'success' ? 'bg-green-50 text-green-700' :
                    item.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                  }`}>{item.status}</span>
                ),
              },
              {
                key: 'createdAt',
                header: 'Date',
                render: (item: any) => new Date(item.createdAt).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: '',
                render: (item: any) => (
                  item.status === 'success' && (
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(item._id)} title="Download Invoice">
                      <Download className="h-4 w-4" />
                    </Button>
                  )
                ),
              },
            ]}
            data={data.payments}
          />
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
