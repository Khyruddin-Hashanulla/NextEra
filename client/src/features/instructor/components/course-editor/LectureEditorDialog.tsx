import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { filterLectureData, getDefaultLectureData } from './lectureData';
import { LectureVideoPanel } from './LectureVideoPanel';
import { LectureArticlePanel } from './LectureArticlePanel';
import { LectureQuizPanel } from './LectureQuizPanel';
import { LectureAssignmentPanel } from './LectureAssignmentPanel';
import { LectureResourcesPanel } from './LectureResourcesPanel';

const LECTURE_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
];

export function LectureEditorDialog({
  lecture,
  onSave,
  onClose,
  isSaving,
}: {
  lecture: any;
  onSave: (data: any) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<any>(lecture);

  useEffect(() => {
    setForm(lecture);
  }, [lecture]);

  const handleTypeChange = (newType: string) => {
    const newForm = getDefaultLectureData(newType);
    newForm.title = form.title;
    newForm.description = form.description;
    newForm.duration = form.duration;
    newForm.isFree = form.isFree;
    newForm.seoTitle = form.seoTitle;
    newForm.seoDescription = form.seoDescription;
    newForm.resources = form.resources || [];
    newForm.attachments = form.attachments || [];
    newForm.notes = form.notes;
    newForm.practiceFiles = form.practiceFiles || [];
    setForm(newForm);
  };

  const handleSave = useCallback(() => {
    onSave(filterLectureData(form));
  }, [form, onSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (form.title) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [form.title, handleSave]);

  const set = (patch: Partial<any>) => setForm({ ...form, ...patch });

  const isDirectVideo = form.type === 'video' && form.videoSource?.source === 'direct';

  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '—';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const formBody = (
    <div className="space-y-4 pr-1">
      <div className="space-y-2">
        <label htmlFor="lecture-title" className="text-sm font-medium">
          Title *
        </label>
        <Input
          id="lecture-title"
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Lecture title"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="lecture-type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="lecture-type"
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {LECTURE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {isDirectVideo ? (
          <div className="space-y-2">
            <label htmlFor="lecture-duration" className="text-sm font-medium">
              Duration
            </label>
            <div className="flex h-10 items-center rounded-lg border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
              {formatDuration(form.duration)} (auto)
            </div>
            <p className="text-xs text-muted-foreground">Detected from the uploaded video.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="lecture-duration" className="text-sm font-medium">
              Duration (seconds)
            </label>
            <Input
              id="lecture-duration"
              type="number"
              value={form.duration}
              onChange={(e) => set({ duration: Number(e.target.value) })}
              min={0}
            />
          </div>
        )}
        <div className="flex items-end pb-2">
          <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium w-full">
            Free preview
            <Switch checked={form.isFree} onCheckedChange={(v) => set({ isFree: v })} />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="lecture-description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="lecture-description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
        />
      </div>

      {form.type === 'video' && (
        <div className="space-y-4 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Video Source</h3>
          <LectureVideoPanel
            videoSource={form.videoSource || { source: 'none', url: '', videoId: '' }}
            duration={form.duration}
            onChange={(videoSource) => set({ videoSource })}
            onDurationChange={(duration) => set({ duration })}
          />
        </div>
      )}

      {form.type === 'article' && (
        <div className="space-y-4 rounded-xl border p-4">
          <LectureArticlePanel
            articleContent={form.articleContent || ''}
            onChange={(articleContent) => set({ articleContent })}
          />
        </div>
      )}

      {form.type === 'quiz' && (
        <div className="space-y-4 rounded-xl border p-4">
          <LectureQuizPanel quiz={form.quiz} onChange={(quiz) => set({ quiz })} />
        </div>
      )}

      {form.type === 'assignment' && (
        <div className="space-y-4 rounded-xl border p-4">
          <LectureAssignmentPanel
            assignment={
              form.assignment || {
                question: '',
                instructions: '',
                totalMarks: 100,
                passingMarks: 60,
                allowLateSubmission: false,
                lateSubmissionDays: 7,
                penaltyPercent: 10,
              }
            }
            attachments={form.attachments}
            onChange={(assignment) => set({ assignment })}
            onAttachmentsChange={(attachments) => set({ attachments })}
          />
        </div>
      )}

      <div className="space-y-4 rounded-xl border p-4">
        <LectureResourcesPanel
          value={{
            resources: form.resources || [],
            links: form.links || [],
            notes: form.notes || '',
          }}
          onChange={(v) => set({ resources: v.resources, links: v.links, notes: v.notes })}
        />
      </div>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={handleSave} loading={isSaving} disabled={!form.title}>
        {lecture._id ? 'Update Lecture' : 'Add Lecture'}
      </Button>
    </div>
  );

  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-xl border-t bg-background sm:hidden">
          <SheetHeader>
            <SheetTitle>{lecture._id ? 'Edit Lecture' : 'Add Lecture'}</SheetTitle>
            <SheetDescription>Configure the lecture content. Press Ctrl/Cmd+S to save.</SheetDescription>
          </SheetHeader>
          {formBody}
          {footer}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{lecture._id ? 'Edit Lecture' : 'Add Lecture'}</DialogTitle>
          <DialogDescription>Configure the lecture content. Press Ctrl/Cmd+S to save.</DialogDescription>
        </DialogHeader>

        {formBody}

        <div className="mt-4">{footer}</div>
      </DialogContent>
    </Dialog>
  );
}
