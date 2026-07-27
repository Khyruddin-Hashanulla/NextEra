import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyReminderApi, StudyReminder } from '@/api/endpoints/studyReminder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Bell, Plus, Trash2, Clock, Repeat, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const typeIcons: Record<string, React.ReactNode> = {
  daily: <Repeat className="h-4 w-4" />,
  weekly: <Calendar className="h-4 w-4" />,
  'one-time': <Clock className="h-4 w-4" />,
};

export function StudyRemindersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; type: string; dayOfWeek: number; time: string; course: string }>({ title: '', description: '', type: 'daily', dayOfWeek: 1, time: '09:00', course: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['study-reminders'],
    queryFn: () => studyReminderApi.list().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => studyReminderApi.create(form as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-reminders'] });
      setOpen(false);
      setForm({ title: '', description: '', type: 'daily', dayOfWeek: 1, time: '09:00', course: '' });
      addToast({ title: 'Reminder created', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to create reminder', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studyReminderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-reminders'] });
      addToast({ title: 'Reminder deleted', variant: 'success' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => studyReminderApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-reminders'] }),
  });

  const reminders = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Reminders</h1>
          <p className="text-muted-foreground">Set reminders for your study sessions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> New Reminder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Study time!" />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Review Chapter 5" />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="one-time">One Time</option>
                </select>
              </div>
              {form.type === 'weekly' && (
                <div>
                  <Label>Day of Week</Label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {dayNames.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title.trim()} className="w-full">
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : reminders.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          <Bell className="mx-auto h-8 w-8 mb-2" />
          <p>No study reminders set</p>
          <Button variant="link" onClick={() => setOpen(true)}>Create your first reminder</Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reminders.map((reminder: any) => (
            <Card key={reminder._id} className={!reminder.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {typeIcons[reminder.type] || <Bell className="h-4 w-4" />}
                      <h3 className="font-medium truncate">{reminder.title}</h3>
                      <Switch
                        checked={reminder.isActive}
                        onCheckedChange={() => toggleMutation.mutate(reminder._id)}
                      />
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {reminder.time}
                      </span>
                      <span className="capitalize">{reminder.type}</span>
                      {reminder.type === 'weekly' && (
                        <span>{dayNames[reminder.dayOfWeek]}</span>
                      )}
                      {reminder.course?.title && (
                        <span>· {reminder.course.title}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 h-auto p-1 shrink-0 ml-2" onClick={() => deleteMutation.mutate(reminder._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
