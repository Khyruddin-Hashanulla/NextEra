import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { QuizQuestionBuilder } from '@/features/instructor/components/QuizQuestionBuilder';
import { LectureQuiz } from '@/types/instructor';

export function LectureQuizPanel({ quiz, onChange }: { quiz: LectureQuiz; onChange: (q: LectureQuiz) => void }) {
  const set = (patch: Partial<LectureQuiz>) => onChange({ ...quiz, ...patch });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Quiz Settings</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="quiz-time" className="text-sm font-medium">Time Limit (min)</label>
          <Input id="quiz-time" type="number" value={quiz?.timeLimit || 0} onChange={(e) => set({ timeLimit: Number(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label htmlFor="quiz-passing" className="text-sm font-medium">Passing Score %</label>
          <Input id="quiz-passing" type="number" value={quiz?.passingScore || 60} onChange={(e) => set({ passingScore: Number(e.target.value) })} min={0} max={100} />
        </div>
        <div className="space-y-2">
          <label htmlFor="quiz-attempts" className="text-sm font-medium">Max Attempts</label>
          <Input id="quiz-attempts" type="number" value={quiz?.maxAttempts || 3} onChange={(e) => set({ maxAttempts: Number(e.target.value) })} min={1} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="quiz-cooldown" className="text-sm font-medium">Attempt Cooldown (min)</label>
          <Input id="quiz-cooldown" type="number" value={quiz?.attemptCooldownMinutes || 0} onChange={(e) => set({ attemptCooldownMinutes: Number(e.target.value) })} min={0} />
        </div>
        <div className="space-y-2">
          <label htmlFor="quiz-policy" className="text-sm font-medium">Scoring Policy</label>
          <select
            id="quiz-policy"
            value={quiz?.scoringPolicy || 'best'}
            onChange={(e) => set({ scoringPolicy: e.target.value as LectureQuiz['scoringPolicy'] })}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="best">Best attempt</option>
            <option value="latest">Latest attempt</option>
            <option value="average">Average of attempts</option>
            <option value="highest">Highest score</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium">
          Show results after submission
          <Switch checked={quiz?.showResults ?? true} onCheckedChange={(v) => set({ showResults: v })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium">
          Randomize question order
          <Switch checked={quiz?.randomizeQuestions ?? false} onCheckedChange={(v) => set({ randomizeQuestions: v })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium">
          Shuffle options
          <Switch checked={quiz?.shuffleOptions ?? false} onCheckedChange={(v) => set({ shuffleOptions: v })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium">
          Allow resume
          <Switch checked={quiz?.allowResume ?? true} onCheckedChange={(v) => set({ allowResume: v })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium">
          Negative marking
          <Switch checked={quiz?.negativeMarking ?? false} onCheckedChange={(v) => set({ negativeMarking: v })} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm font-medium">
          Partial marking
          <Switch checked={quiz?.partialMarking ?? false} onCheckedChange={(v) => set({ partialMarking: v })} />
        </label>
      </div>

      <div className="border-t pt-4">
        <h4 className="mb-3 text-sm font-semibold">Questions</h4>
        <QuizQuestionBuilder
          questions={quiz?.questions || []}
          onChange={(questions) => set({ questions })}
        />
      </div>
    </div>
  );
}
