import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { QuizQuestion, QuizQuestionType } from '@/types/instructor';

interface EditableQuestion {
  question: string;
  type: QuizQuestionType;
  options: string[];
  correctIndices: number[];
  booleanValue: 'true' | 'false';
  fillAnswers: string[];
  matchingPairs: { left: string; right: string }[];
  explanation: string;
  marks: number;
  negativeMarks: number;
  isBonus: boolean;
  weight: number;
}

const QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  single: 'Single Choice',
  multiple: 'Multiple Choice',
  boolean: 'True / False',
  fill_blank: 'Fill in the Blank',
  matching: 'Matching',
  coding: 'Coding',
  essay: 'Essay',
};

function defaultQuestion(type: QuizQuestionType = 'single'): EditableQuestion {
  return {
    question: '',
    type,
    options: type === 'boolean' ? ['True', 'False'] : ['', ''],
    correctIndices: [],
    booleanValue: 'true',
    fillAnswers: [''],
    matchingPairs: [{ left: '', right: '' }],
    explanation: '',
    marks: 1,
    negativeMarks: 0,
    isBonus: false,
    weight: 1,
  };
}

function parseQuestion(q: QuizQuestion): EditableQuestion {
  const type = q.type || 'single';
  const base = {
    question: q.question || '',
    type,
    options: q.options && q.options.length ? q.options : type === 'boolean' ? ['True', 'False'] : ['', ''],
    explanation: q.explanation || '',
    marks: q.marks ?? 1,
    negativeMarks: q.negativeMarks ?? 0,
    isBonus: !!q.isBonus,
    weight: q.weight ?? 1,
  };

  if (type === 'single' || type === 'multiple') {
    let correctIndices: number[] = [];
    if (q.correctAnswer) {
      if (type === 'single') {
        const idx = q.options.indexOf(q.correctAnswer);
        if (idx >= 0) correctIndices = [idx];
      } else {
        try {
          const arr = JSON.parse(q.correctAnswer);
          correctIndices = arr.map((a: string) => q.options.indexOf(a)).filter((i: number) => i >= 0);
        } catch {
          // invalid stored JSON — fall back to empty selection
        }
      }
    }
    return { ...base, correctIndices, booleanValue: 'true', fillAnswers: [], matchingPairs: [] };
  }

  if (type === 'boolean') {
    const bool = String(q.correctAnswer || '').toLowerCase() === 'true';
    return { ...base, correctIndices: [], booleanValue: bool ? 'true' : 'false', fillAnswers: [], matchingPairs: [] };
  }

  if (type === 'fill_blank') {
    let fillAnswers: string[] = [];
    if (q.correctAnswer) {
      try {
        const arr = JSON.parse(q.correctAnswer);
        fillAnswers = Array.isArray(arr) ? arr.map(String) : [q.correctAnswer];
      } catch {
        fillAnswers = [q.correctAnswer];
      }
    }
    return {
      ...base,
      correctIndices: [],
      booleanValue: 'true',
      fillAnswers: fillAnswers.length ? fillAnswers : [''],
      matchingPairs: [],
    };
  }

  if (type === 'matching') {
    let matchingPairs = [{ left: '', right: '' }];
    if (q.correctAnswer) {
      try {
        const obj = JSON.parse(q.correctAnswer);
        matchingPairs = Object.entries(obj).map(([left, right]) => ({ left, right: String(right) }));
      } catch {
        // invalid stored JSON — fall back to empty pairs
      }
    }
    return { ...base, correctIndices: [], booleanValue: 'true', fillAnswers: [], matchingPairs };
  }

  return { ...base, correctIndices: [], booleanValue: 'true', fillAnswers: [], matchingPairs: [] };
}

function serializeQuestion(e: EditableQuestion): QuizQuestion {
  const q: QuizQuestion = {
    question: e.question,
    options: e.options,
    correctAnswer: '',
    explanation: e.explanation,
    marks: e.marks,
    type: e.type,
    negativeMarks: e.negativeMarks,
    isBonus: e.isBonus,
    weight: e.weight,
  };

  if (e.type === 'single' && e.correctIndices.length) {
    q.correctAnswer = e.options[e.correctIndices[0]] || '';
  } else if (e.type === 'multiple') {
    q.correctAnswer = JSON.stringify(e.correctIndices.map((i) => e.options[i]).filter(Boolean));
  } else if (e.type === 'boolean') {
    q.correctAnswer = e.booleanValue;
  } else if (e.type === 'fill_blank') {
    q.correctAnswer = JSON.stringify(e.fillAnswers.map((s) => s.trim()).filter(Boolean));
  } else if (e.type === 'matching') {
    q.correctAnswer = JSON.stringify(
      Object.fromEntries(
        e.matchingPairs.filter((p) => p.left.trim() && p.right.trim()).map((p) => [p.left.trim(), p.right.trim()])
      )
    );
  }

  return q;
}

export function QuizQuestionBuilder({
  questions,
  onChange,
}: {
  questions: QuizQuestion[];
  onChange: (q: QuizQuestion[]) => void;
}) {
  const [items, setItems] = useState<EditableQuestion[]>(() => questions.map(parseQuestion));

  useEffect(() => {
    setItems(questions.map(parseQuestion));
  }, [questions]);

  const commit = (next: EditableQuestion[]) => {
    setItems(next);
    onChange(next.map(serializeQuestion));
  };

  const updateItem = (index: number, patch: Partial<EditableQuestion>) => {
    commit(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addQuestion = () => {
    commit([...items, defaultQuestion()]);
  };

  const removeQuestion = (index: number) => {
    commit(items.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const changeType = (index: number, type: QuizQuestionType) => {
    const current = items[index];
    const fresh = defaultQuestion(type);
    commit(
      items.map((item, i) =>
        i === index
          ? { ...fresh, question: current.question, explanation: current.explanation, marks: current.marks }
          : item
      )
    );
  };

  const toggleCorrectIndex = (index: number, optIdx: number) => {
    const item = items[index];
    if (item.type === 'single') {
      updateItem(index, { correctIndices: [optIdx] });
    } else {
      const has = item.correctIndices.includes(optIdx);
      updateItem(index, {
        correctIndices: has ? item.correctIndices.filter((i) => i !== optIdx) : [...item.correctIndices, optIdx],
      });
    }
  };

  const totalMarks = items.reduce((sum, item) => sum + (item.marks || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} question{items.length !== 1 ? 's' : ''} · {totalMarks} total marks
        </p>
        <Button variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="mr-1 h-4 w-4" /> Add Question
        </Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No questions yet. Click “Add Question” to build your quiz.
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold">Question {index + 1}</span>
            <select
              value={item.type}
              onChange={(e) => changeType(index, e.target.value as QuizQuestionType)}
              className="flex h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm"
            >
              {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => moveQuestion(index, -1)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={index === items.length - 1}
                onClick={() => moveQuestion(index, 1)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <Textarea
            value={item.question}
            onChange={(e) => updateItem(index, { question: e.target.value })}
            placeholder="Type your question here"
            rows={2}
          />

          {(item.type === 'single' || item.type === 'multiple' || item.type === 'boolean') && (
            <div className="space-y-2">
              {item.type === 'boolean' ? (
                <div className="flex items-center gap-2">
                  {['true', 'false'].map((val) => (
                    <label
                      key={val}
                      className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <input
                        type="radio"
                        checked={item.booleanValue === val}
                        onChange={() => updateItem(index, { booleanValue: val as 'true' | 'false' })}
                      />
                      {val === 'true' ? 'True' : 'False'}
                    </label>
                  ))}
                </div>
              ) : (
                item.options.map((opt, optIdx) => {
                  const isCorrect = item.correctIndices.includes(optIdx);
                  return (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type={item.type === 'single' ? 'radio' : 'checkbox'}
                        checked={isCorrect}
                        onChange={() => toggleCorrectIndex(index, optIdx)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateItem(index, {
                            options: item.options.map((o, i) => (i === optIdx ? e.target.value : o)),
                          })
                        }
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className={isCorrect ? 'border-green-500' : ''}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={item.options.length <= 2}
                        onClick={() => {
                          const next = item.options.filter((_, i) => i !== optIdx);
                          updateItem(index, {
                            options: next,
                            correctIndices: item.correctIndices
                              .filter((i) => i !== optIdx)
                              .map((i) => (i > optIdx ? i - 1 : i)),
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })
              )}
              {(item.type === 'single' || item.type === 'multiple') && (
                <Button variant="ghost" size="sm" onClick={() => updateItem(index, { options: [...item.options, ''] })}>
                  <Plus className="mr-1 h-3 w-3" /> Add option
                </Button>
              )}
            </div>
          )}

          {item.type === 'fill_blank' && (
            <div className="space-y-2">
              {item.fillAnswers.map((ans, ansIdx) => (
                <div key={ansIdx} className="flex items-center gap-2">
                  <Input
                    value={ans}
                    onChange={(e) =>
                      updateItem(index, {
                        fillAnswers: item.fillAnswers.map((a, i) => (i === ansIdx ? e.target.value : a)),
                      })
                    }
                    placeholder="Accepted answer (case-insensitive)"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={item.fillAnswers.length <= 1}
                    onClick={() => updateItem(index, { fillAnswers: item.fillAnswers.filter((_, i) => i !== ansIdx) })}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateItem(index, { fillAnswers: [...item.fillAnswers, ''] })}
              >
                <Plus className="mr-1 h-3 w-3" /> Add accepted answer
              </Button>
            </div>
          )}

          {item.type === 'matching' && (
            <div className="space-y-2">
              {item.matchingPairs.map((pair, pairIdx) => (
                <div key={pairIdx} className="flex items-center gap-2">
                  <Input
                    value={pair.left}
                    onChange={(e) =>
                      updateItem(index, {
                        matchingPairs: item.matchingPairs.map((p, i) =>
                          i === pairIdx ? { ...p, left: e.target.value } : p
                        ),
                      })
                    }
                    placeholder="Left item"
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    value={pair.right}
                    onChange={(e) =>
                      updateItem(index, {
                        matchingPairs: item.matchingPairs.map((p, i) =>
                          i === pairIdx ? { ...p, right: e.target.value } : p
                        ),
                      })
                    }
                    placeholder="Right match"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={item.matchingPairs.length <= 1}
                    onClick={() =>
                      updateItem(index, { matchingPairs: item.matchingPairs.filter((_, i) => i !== pairIdx) })
                    }
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateItem(index, { matchingPairs: [...item.matchingPairs, { left: '', right: '' }] })}
              >
                <Plus className="mr-1 h-3 w-3" /> Add pair
              </Button>
            </div>
          )}

          {(item.type === 'coding' || item.type === 'essay') && (
            <p className="text-xs text-muted-foreground">
              {item.type === 'coding'
                ? 'Coding questions are graded manually by you.'
                : 'Essay questions are graded manually by you.'}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Marks</label>
              <Input
                type="number"
                min={0}
                value={item.marks}
                onChange={(e) => updateItem(index, { marks: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Negative marks</label>
              <Input
                type="number"
                min={0}
                value={item.negativeMarks}
                onChange={(e) => updateItem(index, { negativeMarks: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Weight</label>
              <Input
                type="number"
                min={0}
                value={item.weight}
                onChange={(e) => updateItem(index, { weight: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch checked={item.isBonus} onCheckedChange={(v) => updateItem(index, { isBonus: v })} />
                Bonus
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Explanation (shown after answer)</label>
            <Textarea
              value={item.explanation}
              onChange={(e) => updateItem(index, { explanation: e.target.value })}
              placeholder="Optional explanation for students"
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
