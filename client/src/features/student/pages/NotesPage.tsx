import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { CardGridSkeleton } from '@/components/skeletons/ListSkeleton';
import { Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['student', 'notes'],
    queryFn: () => studentApi.listNotes().then((r: any) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notes'] });
      addToast({ title: 'Note deleted', variant: 'success' });
    },
  });

  if (isLoading) {
    return <CardGridSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Notes</h1>
        <p className="text-muted-foreground">All your lecture notes in one place</p>
      </div>

      {!notes?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No notes yet. Start watching courses and take notes!</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note: any) => (
            <Card key={note._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1 text-sm">{note.lecture?.title || 'Unknown Lecture'}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(note._id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-4 text-sm text-muted-foreground">{note.content}</p>
                {note.timestamp !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">Timestamp: {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
