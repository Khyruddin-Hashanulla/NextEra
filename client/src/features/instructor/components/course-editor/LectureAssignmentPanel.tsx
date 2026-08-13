import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileUploader } from './FileUploader';
import { uploadApi } from '@/api/endpoints/upload';
import { LectureAttachment } from '@/types/instructor';

interface AssignmentData {
  question: string;
  instructions: string;
  dueDate?: string;
  totalMarks: number;
  passingMarks: number;
  allowLateSubmission: boolean;
  lateSubmissionDays: number;
  penaltyPercent: number;
}

export function LectureAssignmentPanel({
  assignment,
  attachments,
  onChange,
  onAttachmentsChange,
}: {
  assignment: AssignmentData;
  attachments?: LectureAttachment[];
  onChange: (a: AssignmentData) => void;
  onAttachmentsChange: (files: LectureAttachment[]) => void;
}) {
  const set = (patch: Partial<AssignmentData>) => onChange({ ...assignment, ...patch });

  const removeAttachment = (index: number) => {
    const next = (attachments || []).filter((_, i) => i !== index);
    onAttachmentsChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="assignment-question" className="text-sm font-medium">
          Question / Instructions *
        </label>
        <Textarea
          id="assignment-question"
          value={assignment.question || ''}
          onChange={(e) => set({ question: e.target.value })}
          rows={4}
          placeholder="Describe the assignment task"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="assignment-details" className="text-sm font-medium">
          Additional Details
        </label>
        <Textarea
          id="assignment-details"
          value={assignment.instructions || ''}
          onChange={(e) => set({ instructions: e.target.value })}
          rows={3}
          placeholder="Submission format, references, tips…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="assignment-due" className="text-sm font-medium">
            Deadline
          </label>
          <Input
            id="assignment-due"
            type="date"
            value={assignment.dueDate ? String(assignment.dueDate).slice(0, 10) : ''}
            onChange={(e) => set({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="assignment-total" className="text-sm font-medium">
              Total Marks
            </label>
            <Input
              id="assignment-total"
              type="number"
              value={assignment.totalMarks || 100}
              onChange={(e) => set({ totalMarks: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="assignment-passing" className="text-sm font-medium">
              Passing Marks
            </label>
            <Input
              id="assignment-passing"
              type="number"
              value={assignment.passingMarks || 60}
              onChange={(e) => set({ passingMarks: Number(e.target.value) })}
              min={0}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3 space-y-3">
        <label className="flex items-center justify-between gap-2 text-sm font-medium">
          Allow late submissions
          <Switch
            checked={assignment.allowLateSubmission ?? false}
            onCheckedChange={(v) => set({ allowLateSubmission: v })}
          />
        </label>
        {assignment.allowLateSubmission && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="late-days" className="text-sm font-medium">
                Late window (days)
              </label>
              <Input
                id="late-days"
                type="number"
                value={assignment.lateSubmissionDays || 7}
                onChange={(e) => set({ lateSubmissionDays: Number(e.target.value) })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="penalty" className="text-sm font-medium">
                Penalty %
              </label>
              <Input
                id="penalty"
                type="number"
                value={assignment.penaltyPercent || 10}
                onChange={(e) => set({ penaltyPercent: Number(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Assignment Files (problem statement, starter code…)</label>
        <FileUploader
          accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.webp,.txt,.py,.js,.ts,.java,.c,.cpp,.h,.html,.css,.json,.md"
          maxSize={25 * 1024 * 1024}
          label="Upload a file"
          hint="Max 25MB"
          value={null}
          onChange={(r) => {
            if (r) {
              onAttachmentsChange([
                ...(attachments || []),
                { url: r.url, publicId: r.publicId, name: r.name || 'Attachment', type: 'file', size: 0 },
              ]);
            }
          }}
          upload={uploadApi.document}
        />
        {attachments && attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    View file
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="rounded p-1 text-sm text-destructive hover:bg-muted"
                  aria-label={`Remove ${a.name}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
