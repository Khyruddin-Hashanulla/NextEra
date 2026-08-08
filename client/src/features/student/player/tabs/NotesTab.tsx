import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { studentApi } from '@/api/endpoints/student';
import { EmptyState } from '@/components/common/EmptyState';
import { StickyNote } from 'lucide-react';

interface NotesTabProps {
  courseId: string;
  lectureId: string;
}

export function NotesTab({ courseId, lectureId }: NotesTabProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [newNote, setNewNote] = useState('');

  const { data: notes } = useQuery({
    queryKey: ['student', 'notes', lectureId],
    queryFn: () => studentApi.listNotes({ courseId, lectureId }).then((r: any) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => studentApi.createNote({ courseId, lectureId, content: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notes', lectureId] });
      setNewNote('');
      addToast({ title: 'Note added', variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notes', lectureId] });
      addToast({ title: 'Note deleted', variant: 'success' });
    },
  });

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex gap-2">
          <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write a note..." rows={3} />
          <Button onClick={() => createMutation.mutate()} disabled={!newNote.trim()} className="shrink-0">Add</Button>
        </div>
        {notes?.length ? (
          notes.map((note: any) => (
            <div key={note._id} className="rounded-lg border p-3">
              <p className="text-sm">{note.content}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</span>
                <button onClick={() => deleteMutation.mutate(note._id)} className="text-xs text-destructive hover:underline">Delete</button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<StickyNote className="h-6 w-6 text-muted-foreground" />}
            title="No notes yet"
            description="Capture your thoughts and key takeaways for this lecture."
          />
        )}
      </CardContent>
    </Card>
  );
}