import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AssignmentSubmission } from '@/types/student';
import { Download, FileText, Send, Clock } from 'lucide-react';

interface AssignmentSubmissionSummaryProps {
  submission: AssignmentSubmission;
}

export function AssignmentSubmissionSummary({ submission }: AssignmentSubmissionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-primary" aria-hidden="true" />
          Your Submission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Submitted {new Date(submission.submittedAt).toLocaleString()}
          </span>
          {submission.submissionVersion > 1 && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">Version {submission.submissionVersion}</span>
          )}
          {submission.resubmittedAt && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              Resubmitted {new Date(submission.resubmittedAt).toLocaleString()}
            </span>
          )}
        </p>

        {submission.content && (
          <p className="whitespace-pre-line break-words rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
            {submission.content}
          </p>
        )}

        {submission.files?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Attachments ({submission.files.length})
            </p>
            {submission.files.map((f) => (
              <div key={f.publicId} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate text-sm">{f.name}</span>
                </div>
                <a href={f.url} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}