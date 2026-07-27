import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveClassApi } from '@/api/endpoints/liveClass';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Loader2, Plus, Video, VideoOff, Play, Square, ExternalLink,
  Clock, Calendar, Copy, Trash2,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  live: 'bg-green-100 text-green-700',
  ended: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function LiveClassesPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [tab, setTab] = useState<'classes' | 'recordings'>('classes');

  const [form, setForm] = useState({
    course: '', title: '', description: '', topic: '', agenda: '',
    startTime: '', duration: 60, timezone: 'UTC', password: '',
    meetingProvider: 'zoom', notifyStudents: true,
    settings: { muteOnEntry: true, approvalType: 'automatic', waitingRoom: true, qa: true, chat: true, allowRecording: true },
    recording: { autoRecord: false },
  });

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['instructor-live-classes', page, statusFilter],
    queryFn: () => liveClassApi.listInstructorLiveClasses({ page, limit: 10, status: statusFilter || undefined }).then((r) => r.data.data),
    enabled: tab === 'classes',
  });

  const { data: recordingsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['instructor-recordings', page],
    queryFn: () => liveClassApi.listInstructorRecordings({ page, limit: 10 }).then((r) => r.data.data),
    enabled: tab === 'recordings',
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => liveClassApi.createLiveClass(d as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-live-classes'] }); addToast({ title: 'Live class created', variant: 'success' }); setOpen(false); },
    onError: () => addToast({ title: 'Create failed', variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => liveClassApi.updateLiveClass(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-live-classes'] }); addToast({ title: 'Updated', variant: 'success' }); },
    onError: () => addToast({ title: 'Update failed', variant: 'error' }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => liveClassApi.cancelLiveClass(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-live-classes'] }); addToast({ title: 'Cancelled', variant: 'success' }); },
    onError: () => addToast({ title: 'Cancel failed', variant: 'error' }),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => liveClassApi.startLiveClass(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-live-classes'] }); addToast({ title: 'Class started', variant: 'success' }); },
    onError: () => addToast({ title: 'Start failed', variant: 'error' }),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => liveClassApi.endLiveClass(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-live-classes'] }); addToast({ title: 'Class ended', variant: 'success' }); },
    onError: () => addToast({ title: 'End failed', variant: 'error' }),
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (id: string) => liveClassApi.deleteRecording(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-recordings'] }); addToast({ title: 'Recording deleted', variant: 'success' }); },
    onError: () => addToast({ title: 'Delete failed', variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ course: '', title: '', description: '', topic: '', agenda: '', startTime: '', duration: 60, timezone: 'UTC', password: '', meetingProvider: 'zoom', notifyStudents: true, settings: { muteOnEntry: true, approvalType: 'automatic', waitingRoom: true, qa: true, chat: true, allowRecording: true }, recording: { autoRecord: false } });
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      course: item.course?._id || '', title: item.title, description: item.description,
      topic: item.topic, agenda: item.agenda,
      startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '',
      duration: item.duration, timezone: item.timezone, password: '', meetingProvider: item.meetingProvider,
      notifyStudents: item.notifyStudents,
      settings: item.settings, recording: item.recording,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing._id, d: form });
    else createMutation.mutate(form);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ title: 'Copied to clipboard', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Classes</h1>
          <p className="text-muted-foreground">Schedule and manage live Zoom classes for your students</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Schedule Class</Button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <button className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === 'classes' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground'}`} onClick={() => { setTab('classes'); setPage(1); }}>Live Classes</button>
        <button className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === 'recordings' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground'}`} onClick={() => { setTab('recordings'); setPage(1); }}>Recordings</button>
      </div>

      {tab === 'classes' && (
        <>
          <div className="flex gap-2">
            {['', 'scheduled', 'live', 'ended', 'cancelled'].map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s || 'All'}
              </Button>
            ))}
          </div>

          {classesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <DataTable
              columns={[
                { key: 'title', header: 'Title', render: (item: any) => (
                  <div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.course?.title}</p></div>
                )},
                { key: 'startTime', header: 'Schedule', render: (item: any) => (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />{new Date(item.startTime).toLocaleDateString()}
                    <Clock className="ml-1 h-3 w-3" />{new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )},
                { key: 'duration', header: 'Duration', render: (item: any) => `${item.duration} min` },
                { key: 'status', header: 'Status', render: (item: any) => (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] || ''}`}>
                    {item.status === 'live' && <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />}
                    {item.status}
                  </span>
                )},
                { key: 'attendeeCount', header: 'Attendees' },
                { key: 'joinLink', header: 'Link', render: (item: any) => item.joinLink ? (
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.joinLink)}><Copy className="h-3 w-3" /></Button>
                ) : '-' },
                { key: 'actions', header: '', render: (item: any) => (
                  <div className="flex gap-1">
                    {item.status === 'scheduled' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)} title="Edit">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => startMutation.mutate(item._id)} title="Start"><Play className="h-4 w-4 text-green-600" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => cancelMutation.mutate(item._id)} title="Cancel"><VideoOff className="h-4 w-4 text-red-500" /></Button>
                      </>
                    )}
                    {item.status === 'live' && (
                      <Button variant="ghost" size="sm" onClick={() => endMutation.mutate(item._id)} title="End"><Square className="h-4 w-4 text-red-500" /></Button>
                    )}
                    {item.joinLink && (
                      <Button variant="ghost" size="sm" asChild title="Join">
                        <a href={item.joinLink} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                )},
              ]}
              data={classesData?.classes || []}
              pagination={{
                page: classesData?.pagination?.page || 1,
                limit: classesData?.pagination?.limit || 10,
                total: classesData?.pagination?.total || 0,
                pages: classesData?.pagination?.pages || 1,
              }}
              onPageChange={setPage}
              emptyMessage="No live classes scheduled yet"
            />
          )}
        </>
      )}

      {tab === 'recordings' && (
        <>
          {recordingsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <DataTable
              columns={[
                { key: 'title', header: 'Title', render: (item: any) => (
                  <div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.course?.title}</p></div>
                )},
                { key: 'duration', header: 'Duration', render: (item: any) => {
                  const mins = Math.floor((item.duration || 0) / 60);
                  const secs = (item.duration || 0) % 60;
                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                }},
                { key: 'views', header: 'Views' },
                { key: 'status', header: 'Status', render: (item: any) => (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
                )},
                { key: 'createdAt', header: 'Date', render: (item: any) => new Date(item.createdAt).toLocaleDateString() },
                { key: 'url', header: '', render: (item: any) => item.url ? (
                  <Button variant="ghost" size="sm" asChild><a href={item.url} target="_blank" rel="noreferrer"><Video className="h-4 w-4" /></a></Button>
                ) : null },
                { key: 'actions', header: '', render: (item: any) => (
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteRecordingMutation.mutate(item._id)}><Trash2 className="h-4 w-4" /></Button>
                )},
              ]}
              data={recordingsData?.recordings || []}
              pagination={{
                page: recordingsData?.pagination?.page || 1,
                limit: recordingsData?.pagination?.limit || 10,
                total: recordingsData?.pagination?.total || 0,
                pages: recordingsData?.pagination?.pages || 1,
              }}
              onPageChange={setPage}
              emptyMessage="No recordings yet"
            />
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Live Class' : 'Schedule Live Class'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Course ID</Label><Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course ID" /></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
              <div><Label>Meeting Provider</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.meetingProvider} onChange={(e) => setForm({ ...form, meetingProvider: e.target.value })}>
                  <option value="zoom">Zoom</option><option value="google_meet">Google Meet</option><option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Time</Label><Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div><Label>Duration (minutes)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Timezone</Label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></div>
              <div><Label>Password</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            </div>
            <div><Label>Agenda</Label><Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={2} /></div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.settings.muteOnEntry} onCheckedChange={(v) => setForm({ ...form, settings: { ...form.settings, muteOnEntry: v } })} />
                  <Label className="text-sm">Mute on Entry</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.settings.waitingRoom} onCheckedChange={(v) => setForm({ ...form, settings: { ...form.settings, waitingRoom: v } })} />
                  <Label className="text-sm">Waiting Room</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.settings.qa} onCheckedChange={(v) => setForm({ ...form, settings: { ...form.settings, qa: v } })} />
                  <Label className="text-sm">Q&A</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.settings.chat} onCheckedChange={(v) => setForm({ ...form, settings: { ...form.settings, chat: v } })} />
                  <Label className="text-sm">Chat</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.settings.allowRecording} onCheckedChange={(v) => setForm({ ...form, settings: { ...form.settings, allowRecording: v } })} />
                  <Label className="text-sm">Allow Recording</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.recording.autoRecord} onCheckedChange={(v) => setForm({ ...form, recording: { ...form.recording, autoRecord: v } })} />
                  <Label className="text-sm">Auto Record (Cloud)</Label>
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-sm">Approval Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" value={form.settings.approvalType} onChange={(e) => setForm({ ...form, settings: { ...form.settings, approvalType: e.target.value } })}>
                  <option value="automatic">Automatic</option><option value="manual">Manual</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.notifyStudents} onCheckedChange={(v) => setForm({ ...form, notifyStudents: v })} />
              <Label>Notify enrolled students</Label>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
