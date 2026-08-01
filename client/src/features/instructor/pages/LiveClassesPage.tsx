import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { liveClassApi } from '@/api/endpoints/liveClass';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import {
  Plus, Video, VideoOff, Play, Square, ExternalLink,
  Clock, Calendar, Copy, Trash2, Monitor, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ended: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const recordingStatusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Ready',
  failed: 'Failed',
  deleted: 'Deleted',
  available: 'Ready',
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
    queryFn: ({ signal }) => liveClassApi.listInstructorLiveClasses({ page, limit: 10, status: statusFilter || undefined }, signal).then((r) => r.data.data),
    enabled: tab === 'classes',
  });

  const { data: recordingsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['instructor-recordings', page],
    queryFn: ({ signal }) => liveClassApi.listInstructorRecordings({ page, limit: 10 }, signal).then((r) => r.data.data),
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

  const syncRecordingMutation = useMutation({
    mutationFn: (liveClassId: string) => liveClassApi.syncRecordings(liveClassId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor-recordings'] }); addToast({ title: 'Recordings synced', variant: 'success' }); },
    onError: () => addToast({ title: 'Sync failed', variant: 'error' }),
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Classes</h1>
          <p className="mt-1 text-muted-foreground">Schedule and manage live classes for your students</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Schedule Class
        </Button>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 border-b pb-2">
        {(['classes', 'recordings'] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setTab(t); setPage(1); }}
          >
            {t === 'classes' ? 'Live Classes' : 'Recordings'}
          </button>
        ))}
      </motion.div>

      {tab === 'classes' && (
        <motion.div variants={item} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['', 'scheduled', 'live', 'ended', 'cancelled'].map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s || 'All'}
              </Button>
            ))}
          </div>

          {classesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !classesData?.classes?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Monitor className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="font-medium">No live classes scheduled</p>
                <p className="mt-1 text-sm text-muted-foreground">Schedule your first live class</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="mr-1.5 h-4 w-4" /> Schedule Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Schedule</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Attendees</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Link</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classesData.classes.map((cls: any) => (
                        <tr key={cls._id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium">{cls.title}</p>
                            <p className="text-xs text-muted-foreground">{cls.course?.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(cls.startTime).toLocaleDateString()}
                              <Clock className="ml-1 h-3 w-3" />
                              {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3">{cls.duration} min</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[cls.status] || ''}`}>
                              {cls.status === 'live' && <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />}
                              {cls.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{cls.attendeeCount || 0}</td>
                          <td className="px-4 py-3">
                            {cls.joinLink ? (
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cls.joinLink)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {cls.status === 'scheduled' && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => openEdit(cls)}>Edit</Button>
                                  <Button variant="ghost" size="sm" onClick={() => startMutation.mutate(cls._id)}>
                                    <Play className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => cancelMutation.mutate(cls._id)}>
                                    <VideoOff className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                              {cls.status === 'live' && (
                                <Button variant="ghost" size="sm" onClick={() => endMutation.mutate(cls._id)}>
                                  <Square className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                              {cls.joinLink && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={cls.joinLink} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {classesData?.pagination && classesData.pagination.pages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Page {classesData.pagination.page} of {classesData.pagination.pages} ({classesData.pagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= (classesData.pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {tab === 'recordings' && (
        <motion.div variants={item}>
          {recordingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !recordingsData?.recordings?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Video className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="font-medium">No recordings yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Recordings will appear here after live classes end</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Views</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recordingsData.recordings.map((rec: any) => {
                        const mins = Math.floor((rec.duration || 0) / 60);
                        const secs = (rec.duration || 0) % 60;
                        return (
                          <tr key={rec._id} className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <p className="font-medium">{rec.title}</p>
                              <p className="text-xs text-muted-foreground">{rec.course?.title}</p>
                            </td>
                            <td className="px-4 py-3">{mins}:{secs.toString().padStart(2, '0')}</td>
                            <td className="px-4 py-3">{rec.views || 0}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rec.status === 'completed' || rec.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : rec.status === 'failed' || rec.status === 'deleted' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                {recordingStatusLabels[rec.status] || rec.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(rec.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {rec.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={rec.url} target="_blank" rel="noreferrer"><Video className="h-4 w-4" /></a>
                                  </Button>
                                )}
                                {rec.liveClass && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Refresh from Zoom"
                                    disabled={syncRecordingMutation.isPending}
                                    onClick={() => syncRecordingMutation.mutate(rec.liveClass)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRecordingMutation.mutate(rec._id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {recordingsData?.pagination && recordingsData.pagination.pages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Page {recordingsData.pagination.page} of {recordingsData.pagination.pages} ({recordingsData.pagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= (recordingsData.pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Edit Live Class' : 'Schedule Live Class'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Course ID</Label>
                <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course ID" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Meeting Provider</Label>
                  <select value={form.meetingProvider} onChange={(e) => setForm({ ...form, meetingProvider: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Agenda</Label>
                <Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={2} />
              </div>
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
                <div className="mt-3 space-y-2">
                  <Label className="text-sm">Approval Type</Label>
                  <select value={form.settings.approvalType} onChange={(e) => setForm({ ...form, settings: { ...form.settings, approvalType: e.target.value } })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.notifyStudents} onCheckedChange={(v) => setForm({ ...form, notifyStudents: v })} />
                <Label>Notify enrolled students</Label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
