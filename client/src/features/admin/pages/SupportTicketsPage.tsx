import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, UserCheck, Loader2, Send } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
};

export function SupportTicketsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tickets', page, statusFilter],
    queryFn: ({ signal }) => adminApi.listSupportTickets({ page, limit: 10, status: statusFilter || undefined }, signal),
   });

  const { data: ticketDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-ticket', selectedTicket?._id],
    queryFn: ({ signal }) => adminApi.getSupportTicket(selectedTicket._id, signal),
    enabled: !!selectedTicket,
   });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateTicketStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tickets'] }); queryClient.invalidateQueries({ queryKey: ['admin-ticket'] }); addToast({ title: 'Status updated', variant: 'success' }); },
   });

  const assignMutation = useMutation({
    mutationFn: (id: string) => adminApi.assignTicket(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tickets'] }); queryClient.invalidateQueries({ queryKey: ['admin-ticket'] }); addToast({ title: 'Ticket assigned to you', variant: 'success' }); },
   });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => adminApi.addTicketMessage(id, message),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-ticket'] }); setReplyText(''); addToast({ title: 'Reply sent', variant: 'success' }); },
   });

  const tickets = data?.data?.data?.tickets || [];
  const pagination = data?.data?.data?.pagination;
  const detail = ticketDetail?.data?.data;

  const columns = [
    { header: 'Subject', accessor: (t: any) => (
      <div>
        <p className="font-medium truncate max-w-[250px]">{t.subject}</p>
        <p className="text-xs text-muted-foreground">{t.user?.name} · {t.category}</p>
      </div>
    ) },
    { header: 'Priority', accessor: (t: any) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[t.priority] || ''}`}>{t.priority}</span> },
    { header: 'Status', accessor: (t: any) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || ''}`}>{t.status}</span> },
    { header: 'Assigned', accessor: (t: any) => t.assignedTo?.name || '-' },
    { header: 'Actions', accessor: (t: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(t)}><MessageSquare className="h-3 w-3" /></Button>
        {!t.assignedTo && <Button variant="ghost" size="sm" onClick={() => assignMutation.mutate(t._id)}><UserCheck className="h-3 w-3" /></Button>}
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support Tickets</h1>
      <div className="flex gap-2">
        <Button variant={statusFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(''); setPage(1); }}>All</Button>
        <Button variant={statusFilter === 'open' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('open'); setPage(1); }}>Open</Button>
        <Button variant={statusFilter === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('in_progress'); setPage(1); }}>In Progress</Button>
        <Button variant={statusFilter === 'resolved' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('resolved'); setPage(1); }}>Resolved</Button>
      </div>
      <DataTable columns={columns} data={tickets} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />

      <Dialog open={!!selectedTicket} onOpenChange={(v) => { if (!v) setSelectedTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detail?.subject || 'Loading...'}
              {detail && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[detail.status] || ''}`}>{detail.status}</span>}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {detail.messages?.map((msg: any, i: number) => (
                  <div key={i} className={`rounded-lg p-3 ${msg.sender?._id === detail.user?._id ? 'bg-muted ml-8' : 'bg-primary/5 mr-8'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{msg.sender?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={detail.status} onChange={(e) => statusMutation.mutate({ id: detail._id, status: e.target.value })}>
                  <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
                {!detail.assignedTo && <Button variant="outline" size="sm" onClick={() => assignMutation.mutate(detail._id)}><UserCheck className="mr-1 h-3 w-3" /> Assign to me</Button>}
              </div>
              <div className="flex gap-2">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." rows={3} className="flex-1" />
                <Button onClick={() => replyMutation.mutate({ id: detail._id, message: replyText })} disabled={!replyText.trim() || replyMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
