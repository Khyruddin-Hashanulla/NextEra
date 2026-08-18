import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, BookOpen, FileQuestion } from 'lucide-react';
import { getGradeBadgeVariant, getEvaluationStatusLabel } from './useQuizHistory';
import type { QuizHistoryAttempt, QuizAttemptResult } from '@/types/quiz';

interface QuizAttemptResultDialogProps {
  attempt: QuizHistoryAttempt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result?: QuizAttemptResult;
}

export function QuizAttemptResultDialog({ attempt, open, onOpenChange, result }: QuizAttemptResultDialogProps) {
  const showContent = Boolean(attempt) && Boolean(result);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz Attempt Details</DialogTitle>
          <DialogDescription>
            {attempt ? `Attempt #${attempt.attemptNumber} • ${attempt.title}` : 'Quiz attempt'}
          </DialogDescription>
        </DialogHeader>

        {showContent && attempt && (
          <div className="space-y-4">
            {result?.lecture?.title && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-muted-foreground">
                  Lecture: <span className="font-medium text-foreground">{result.lecture.title}</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {getEvaluationStatusLabel(attempt.evaluationStatus)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                  {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Submitted At</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Question Details</h4>
              {attempt.details && attempt.details.length > 0 ? (
                <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                  {attempt.details.map((detail) => (
                    <div key={detail.questionId} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-foreground">{detail.question}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {detail.isCorrect ? (
                              <Badge variant="success" size="sm" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge variant="destructive" size="sm" className="gap-1">
                                <XCircle className="h-3 w-3" aria-hidden="true" />
                                Incorrect
                              </Badge>
                            )}
                            <Badge variant="outline" size="sm">
                              {detail.marksObtained}/{detail.maxMarks} marks
                            </Badge>
                          </div>
                        </div>
                        {detail.letterGrade && (
                          <Badge variant={getGradeBadgeVariant(detail.letterGrade)}>{detail.letterGrade}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  <FileQuestion className="h-4 w-4" aria-hidden="true" />
                  No question details available for this attempt.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}