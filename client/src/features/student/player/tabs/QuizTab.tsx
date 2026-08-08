import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers/ToastProvider';
import { studentApi } from '@/api/endpoints/student';
import { quizApi } from '@/api/endpoints/quiz';
import type { PlayerLecture } from '../types';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer?: string;
  type: string;
  marks?: number;
};

function parseQuizQuestions(lecture: PlayerLecture): QuizQuestion[] {
  if (lecture?.quiz?.questions?.length) {
    return lecture.quiz.questions.map((q) => ({
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: '',
      type: q.type || 'single',
      marks: q.marks,
    }));
  }
  if (lecture?.assignment?.question) {
    try {
      const parsed = JSON.parse(lecture.assignment.question);
      if (Array.isArray(parsed)) {
        return parsed.map((q: any) => ({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          type: q.type || 'single',
          marks: q.marks,
        }));
      }
    } catch {}
  }
  return [];
}

interface QuizTabProps {
  courseId: string;
  lectureId: string;
  lecture: PlayerLecture;
}

export function QuizTab({ courseId, lectureId, lecture }: QuizTabProps) {
  const { addToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);

  const questions = parseQuizQuestions(lecture);

  const { data: attempts, refetch: refetchAttempts } = useQuery({
    queryKey: ['student', 'quiz-attempts', lectureId],
    queryFn: () => studentApi.getQuizAttempts(lectureId).then((r: any) => r.data.data),
  });

  const lastAttempt = attempts?.[0] || currentAttempt;

  const submitMutation = useMutation({
    mutationFn: async () => {
      let attemptToSubmit = currentAttempt;
      if (!attemptToSubmit?.attempt?._id) {
        const started = await quizApi.startQuizEnhanced({ courseId, lectureId }).then((r: any) => r.data);
        attemptToSubmit = started?.data;
      }
      const attemptId = attemptToSubmit?.attempt?._id;
      if (!attemptId) throw new Error('Failed to start quiz attempt');

      const answersPayload = questions
        .map((q, idx) => {
          const question = q.question;
          const selectedAnswer = q.type === 'fill_blank' ? textAnswers[String(idx)] || '' : answers[String(idx)] || '';
          return { questionId: `q_${idx}`, question, selectedAnswer };
        })
        .filter((a) => a.selectedAnswer.trim() !== '');

      const res = await quizApi.submitQuiz({ attemptId, answers: answersPayload }).then((r: any) => r.data);
      return res?.data?.attempt || res?.attempt;
    },
    onSuccess: (result: any) => {
      setCurrentAttempt(result);
      refetchAttempts();
      const score = result?.score ?? result?.marksObtained ?? 0;
      const total = result?.totalQuestions || questions.length;
      const passed = result?.passed;
      addToast({
        title: passed ? 'Quiz Passed!' : 'Quiz Attempted',
        description: `Score: ${score}/${total} (${result?.percentage ?? 0}%)`,
        variant: passed ? 'success' : 'error',
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to submit quiz';
      addToast({ title: 'Quiz submission failed', description: message, variant: 'error' });
    },
  });

  if (!questions.length) return <p className="text-sm text-muted-foreground">No quiz questions available.</p>;

  const answeredCount = questions.filter((q, idx) =>
    q.type === 'fill_blank' ? (textAnswers[String(idx)] || '').trim() : (answers[String(idx)] || '').trim()
  ).length;

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {lastAttempt && (
          <div className={`rounded-lg p-3 text-sm ${lastAttempt.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            Last attempt: {lastAttempt.score}/{lastAttempt.totalQuestions} ({lastAttempt.passed ? 'Passed' : 'Failed'})
          </div>
        )}
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-sm font-medium">
              {idx + 1}. {q.question}
              {q.marks ? <span className="ml-2 text-xs text-muted-foreground">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span> : null}
            </p>
            {q.type === 'fill_blank' ? (
              <Input
                value={textAnswers[String(idx)] || ''}
                onChange={(e) => setTextAnswers({ ...textAnswers, [String(idx)]: e.target.value })}
                placeholder="Type your answer"
              />
            ) : (
              <div className="space-y-1">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 rounded border p-2 text-sm cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      value={opt}
                      checked={answers[String(idx)] === opt}
                      onChange={() => setAnswers({ ...answers, [String(idx)]: opt })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || answeredCount < questions.length}>
          {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </CardContent>
    </Card>
  );
}