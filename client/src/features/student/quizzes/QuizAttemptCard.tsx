import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, CalendarDays, Clock, Hourglass, FileQuestion, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ScoreRing } from './ScoreRing';
import {
  formatDuration,
  getGradeBadgeVariant,
  getEvaluationStatusLabel,
  isAttemptPublished,
} from './useQuizHistory';
import type { QuizHistoryAttempt } from '@/types/quiz';

interface QuizAttemptCardProps {
  attempt: QuizHistoryAttempt;
  isDownloading: boolean;
  isViewing: boolean;
  onViewResult: (attempt: QuizHistoryAttempt) => void;
  onDownload: (attempt: QuizHistoryAttempt) => void;
}

export function QuizAttemptCard({
  attempt,
  isDownloading,
  isViewing,
  onViewResult,
  onDownload,
}: QuizAttemptCardProps) {
  const published = isAttemptPublished(attempt);
  const { title, attemptNumber, startedAt, score, totalMarks, percentage, passed, letterGrade } = attempt;
  const gradeVariant = getGradeBadgeVariant(letterGrade ?? '');

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm">
                Attempt #{attemptNumber}
              </Badge>
              {passed ? (
                <Badge variant="success" size="sm" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Passed
                </Badge>
              ) : (
                <Badge variant="destructive" size="sm" className="gap-1">
                  <XCircle className="h-3 w-3" aria-hidden="true" />
                  Failed
                </Badge>
              )}
              {letterGrade && (
                <Badge variant={gradeVariant} size="sm">
                  {letterGrade}
                </Badge>
              )}
            </div>

            <h3 className="break-words font-display text-lg font-bold leading-snug tracking-tight text-foreground">
              {title || 'Untitled Quiz'}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {startedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(startedAt)}
                </span>
              )}
              {attempt.timeTaken != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDuration(attempt.timeTaken)}
                </span>
              )}
              {!published && (
                <span className="inline-flex items-center gap-1.5">
                  <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                  {getEvaluationStatusLabel(attempt.evaluationStatus)}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <ScoreRing percentage={percentage} passed={passed} />
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {score}/{totalMarks}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Correct</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {attempt.correctAnswers}/{attempt.totalQuestions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 h-px bg-border" aria-hidden="true" />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {attempt.correctAnswers} correct · {attempt.totalQuestions} questions
          </p>
          <div className="flex flex-wrap gap-2">
            {published && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewResult(attempt)}
                disabled={isViewing}
              >
                <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                View Result
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(attempt)}
              disabled={isDownloading}
              loading={isDownloading}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}