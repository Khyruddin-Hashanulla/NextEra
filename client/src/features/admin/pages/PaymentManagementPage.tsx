import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Eye, DollarSign, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const REFUND_REASONS = [
  { value: 'student_request', label: 'Student Request' },
  { value: 'duplicate_payment', label: 'Duplicate Payment' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'course_removed', label: 'Course Removed' },
  { value: 'admin_decision', label: 'Admin Decision' },
  { value: 'technical_error', label: 'Technical Error' },
];

export function PaymentManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; payment: any }>({ open: false, payment: null });
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, statusFilter],
    queryFn: ({ signal }) => adminApi.listAllPayments({ page, limit: 10, status: statusFilter || undefined }, signal),
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, amount, reason, adminNote }: { paymentId: string; amount: number; reason: string; adminNote?: string }) =>
      adminApi.issueRefund(paymentId, { amount, reason, refundType: amount >= (refundDialog.payment?.amount || 0) ? 'full' : 'partial', adminNote }),
    onSuccess: () => {
      addToast({ title: 'Refund processed', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setRefundDialog({ open: false, payment: null });
      setRefundAmount('');
      setRefundReason('');
      setRefundNote('');
      setSelectedPayment(null);
    },
    onError: (err: any) => {
      addToast({ title: err?.response?.data?.message || 'Refund failed', variant: 'error' });
    },
  });

  const handleOpenRefund = (payment: any) => {
    setRefundAmount(String(payment.amount));
    setRefundReason('');
    setRefundNote('');
    setRefundDialog({ open: true, payment });
  };

  const handleConfirmRefund = () => {
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0 || amount > (refundDialog.payment?.amount || 0)) {
      addToast({ title: `Amount must be between 1 and ${refundDialog.payment?.amount}`, variant: 'error' });
      return;
    }
    if (!refundReason) {
      addToast({ title: 'Please select a refund reason', variant: 'error' });
      return;
    }
    refundMutation.mutate({
      paymentId: refundDialog.payment._id,
      amount,
      reason: refundReason,
      adminNote: refundNote || undefined,
    });
  };

  const payments = data?.data?.data?.payments || [];
  const pagination = data?.data?.data?.pagination;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
        <p className="mt-1 text-muted-foreground">View and manage all platform payments</p>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-2">
        {['', 'success', 'pending', 'failed'].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s || 'All'}
          </Button>
        ))}
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !payments.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <DollarSign className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No payments found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((p: any) => (
                      <tr key={p._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">{p.user?.name || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium capitalize text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{p.course?.title || p.bundle?.title || p.subscription?.name || '-'}</td>
                        <td className="px-4 py-3 font-medium">₹{p.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            p.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Payment Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(null)}>Close</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><strong>User:</strong> {selectedPayment.user?.name}</div>
                <div><strong>Email:</strong> {selectedPayment.user?.email}</div>
                <div><strong>Amount:</strong> ₹{selectedPayment.amount}</div>
                <div><strong>Status:</strong>
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    selectedPayment.status === 'success' ? 'bg-green-100 text-green-700' :
                    selectedPayment.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{selectedPayment.status}</span>
                </div>
                <div><strong>Type:</strong> {selectedPayment.type}</div>
                <div><strong>Currency:</strong> {selectedPayment.currency}</div>
              </div>
              {selectedPayment.razorpayOrderId && (
                <div><strong>Order ID:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selectedPayment.razorpayOrderId}</code></div>
              )}
              {selectedPayment.razorpayPaymentId && (
                <div><strong>Payment ID:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selectedPayment.razorpayPaymentId}</code></div>
              )}
              <div><strong>Date:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}</div>
              {selectedPayment.status === 'failed' && selectedPayment.failureDetails && (
                <div className="space-y-2 border-t pt-3 mt-3">
                  <p className="font-semibold text-red-600 dark:text-red-400">Failure Details</p>
                  {selectedPayment.failureDetails.failureCode && (
                    <div><strong>Code:</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selectedPayment.failureDetails.failureCode}</code></div>
                  )}
                  {selectedPayment.failureDetails.failureReason && (
                    <div><strong>Reason:</strong> {selectedPayment.failureDetails.failureReason}</div>
                  )}
                  {selectedPayment.failureDetails.failureDescription && (
                    <div><strong>Description:</strong> {selectedPayment.failureDetails.failureDescription}</div>
                  )}
                  {selectedPayment.failureDetails.paymentMethod && (
                    <div><strong>Method:</strong> {selectedPayment.failureDetails.paymentMethod}</div>
                  )}
                  {selectedPayment.failureDetails.bank && (
                    <div><strong>Bank:</strong> {selectedPayment.failureDetails.bank}</div>
                  )}
                  {selectedPayment.failureDetails.cardLast4 && (
                    <div><strong>Card:</strong> ....{selectedPayment.failureDetails.cardLast4} {selectedPayment.failureDetails.cardNetwork || ''}</div>
                  )}
                  {selectedPayment.failureDetails.failedAt && (
                    <div><strong>Failed At:</strong> {new Date(selectedPayment.failureDetails.failedAt).toLocaleString()}</div>
                  )}
                </div>
              )}
              {selectedPayment.pendingReason && selectedPayment.status === 'pending' && (
                <div className="space-y-2 border-t pt-3 mt-3">
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400">Pending Reason</p>
                  <div>{selectedPayment.pendingReason}</div>
                </div>
              )}
              {selectedPayment.status === 'success' && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => handleOpenRefund(selectedPayment)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Issue Refund
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={refundDialog.open} onOpenChange={(open) => { if (!open && !refundMutation.isPending) { setRefundDialog({ open: false, payment: null }); setSelectedPayment(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Refund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Amount</Label>
              <p className="text-sm font-semibold">₹{refundDialog.payment?.amount}</p>
            </div>
            <div>
              <Label htmlFor="refundAmount">Refund Amount</Label>
              <Input
                id="refundAmount"
                type="number"
                min={1}
                max={refundDialog.payment?.amount || 0}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="refundReason">Reason</Label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  {REFUND_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="refundNote">Admin Note (optional)</Label>
              <Input id="refundNote" value={refundNote} onChange={(e) => setRefundNote(e.target.value)} />
            </div>
            <Button onClick={handleConfirmRefund} variant="destructive" className="w-full" disabled={refundMutation.isPending}>
              {refundMutation.isPending ? 'Processing Refund...' : 'Confirm Refund'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
