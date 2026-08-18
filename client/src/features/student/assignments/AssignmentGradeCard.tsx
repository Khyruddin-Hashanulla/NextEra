import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AssignmentSubmission } from '@/types/student';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  MessagesSquare,
  Gavel,
} from 'lucide-react';

interface AssignmentGradeCardProps {
  submission: AssignmentSubmission;
}

export function AssignmentGradeCard({ submission }: AssignmentGradeCardProps) {
  const hasGrade = submission.grade !== undefined || submission.letterGrade || submission.percentage !== undefined;

  if (!hasGrade) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4 text-primary" aria-hidden="true" />
          Your Grade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {submission.letterGrade && (
            <span className="font-display text-4xl font-bold tracking-tight text-foreground">
              {submission.letterGrade}
            </span>
          )}
          {submission.percentage !== undefined && <Badge variant="secondary">{submission.percentage}%</Badge>}
          {submission.passFail && (
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold ${
                submission.passFail === 'pass' ? 'text-success' : 'text-destructive'
              }`}
            >
              {submission.passFail === 'pass' ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {submission.passFail === 'pass' ? 'Passed' : 'Failed'}
            </span>
          )}
          {submission.lateSubmission && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Late submission{submission.penaltyPercent > 0 ? ` · ${submission.penaltyPercent}% penalty` : ''}
            </span>
          )}
        </div>

        {submission.feedback && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessagesSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              Feedback
            </p>
            <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
              {submission.feedback}
            </p>
          </div>
        )}

        {submission.gradedFiles && submission.gradedFiles.length > 0 && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Reviewed Files</p>
            <div className="mt-2.5 space-y-2">
              {submission.gradedFiles.map((f) => (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}