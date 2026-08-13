import {
  resolveQuizQuestions,
  gradeQuestion,
  computeAttemptResult,
  computeAttemptScoreByPolicy,
  attemptToCsvRow,
  NormalizedQuestion,
} from '../services/quizScoring.service';

function makeQuestion(overrides: Partial<NormalizedQuestion> = {}): NormalizedQuestion {
  return {
    questionId: 'q_001',
    question: 'Test question',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    explanation: '',
    marks: 1,
    type: 'single',
    negativeMarks: 0,
    isBonus: false,
    weight: 1,
    ...overrides,
  };
}

describe('gradeQuestion', () => {
  it('marks skipped empty answers', () => {
    const result = gradeQuestion(makeQuestion(), '', { negativeMarking: false, partialMarking: false });
    expect(result.status).toBe('skipped');
    expect(result.marksObtained).toBe(0);
  });

  it('grades single correct answer', () => {
    const result = gradeQuestion(makeQuestion(), 'A', { negativeMarking: false, partialMarking: false });
    expect(result.isCorrect).toBe(true);
    expect(result.status).toBe('correct');
    expect(result.marksObtained).toBe(1);
  });

  it('applies negative marking for incorrect answers', () => {
    const result = gradeQuestion(makeQuestion({ negativeMarks: 0.5 }), 'B', {
      negativeMarking: true,
      partialMarking: false,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.status).toBe('incorrect');
    expect(result.marksObtained).toBe(-0.5);
  });

  it('does not penalise when negative marking is disabled', () => {
    const result = gradeQuestion(makeQuestion({ negativeMarks: 2 }), 'B', {
      negativeMarking: false,
      partialMarking: false,
    });
    expect(result.marksObtained).toBe(0);
  });

  it('applies negative marking even for large penalties', () => {
    const result = gradeQuestion(makeQuestion({ negativeMarks: 2 }), 'B', {
      negativeMarking: true,
      partialMarking: false,
    });
    expect(result.marksObtained).toBe(-2);
  });

  it('grades boolean questions case-insensitively', () => {
    const result = gradeQuestion(makeQuestion({ type: 'boolean', correctAnswer: 'TRUE' }), 'true', {
      negativeMarking: false,
      partialMarking: false,
    });
    expect(result.isCorrect).toBe(true);
  });

  it('grades multiple correct exact match', () => {
    const result = gradeQuestion(
      makeQuestion({ type: 'multiple', correctAnswer: JSON.stringify(['A', 'B']) }),
      JSON.stringify(['A', 'B']),
      { negativeMarking: false, partialMarking: false }
    );
    expect(result.isCorrect).toBe(true);
    expect(result.status).toBe('correct');
  });

  it('grades multiple wrong selection as incorrect', () => {
    const result = gradeQuestion(
      makeQuestion({ type: 'multiple', correctAnswer: JSON.stringify(['A', 'B']) }),
      JSON.stringify(['A', 'C']),
      { negativeMarking: false, partialMarking: false }
    );
    expect(result.isCorrect).toBe(false);
    expect(result.status).toBe('incorrect');
  });

  it('awards partial marks for partial multiple selection', () => {
    const result = gradeQuestion(
      makeQuestion({ type: 'multiple', correctAnswer: JSON.stringify(['A', 'B']) }),
      JSON.stringify(['A']),
      { negativeMarking: false, partialMarking: true }
    );
    expect(result.isCorrect).toBe(false);
    expect(result.status).toBe('partial');
    expect(result.marksObtained).toBe(0.5);
  });

  it('grades fill_blank against accepted answers', () => {
    const result = gradeQuestion(
      makeQuestion({ type: 'fill_blank', correctAnswer: JSON.stringify(['react', 'React.js']) }),
      'react',
      { negativeMarking: false, partialMarking: false }
    );
    expect(result.isCorrect).toBe(true);
  });

  it('grades matching questions with partial credit', () => {
    const correct = JSON.stringify({ q1: 'a', q2: 'b' });
    const result = gradeQuestion(
      makeQuestion({ type: 'matching', correctAnswer: correct }),
      JSON.stringify({ q1: 'a', q2: 'c' }),
      { negativeMarking: false, partialMarking: true }
    );
    expect(result.isCorrect).toBe(false);
    expect(result.status).toBe('partial');
    expect(result.marksObtained).toBe(0.5);
  });

  it('marks coding and essay as pending for manual grading', () => {
    for (const type of ['coding', 'essay'] as const) {
      const result = gradeQuestion(makeQuestion({ type }), 'my answer', {
        negativeMarking: false,
        partialMarking: false,
      });
      expect(result.status).toBe('pending');
      expect(result.marksObtained).toBe(0);
    }
  });
});

describe('computeAttemptResult', () => {
  const startedAt = new Date('2026-01-01T00:00:00Z');

  function config(overrides: any = {}) {
    return {
      passingScore: 60,
      timeLimit: 10,
      negativeMarking: false,
      partialMarking: false,
      startedAt,
      submittedAt: new Date('2026-01-01T00:02:30Z'),
      ...overrides,
    };
  }

  it('computes score, percentage, pass/fail and counts', () => {
    const questions = [
      makeQuestion({ questionId: 'q1', correctAnswer: 'A' }),
      makeQuestion({ questionId: 'q2', correctAnswer: 'B' }),
    ];
    const result = computeAttemptResult(
      questions,
      [
        { questionId: 'q1', question: 'q1', selectedAnswer: 'A' },
        { questionId: 'q2', question: 'q2', selectedAnswer: 'C' },
      ],
      config()
    );

    expect(result.score).toBe(1);
    expect(result.totalMarks).toBe(2);
    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(false);
    expect(result.correctAnswers).toBe(1);
    expect(result.incorrectAnswers).toBe(1);
    expect(result.skippedQuestions).toBe(0);
    expect(result.timeTaken).toBe(150);
    expect(result.evaluationStatus).toBe('auto_graded');
  });

  it('excludes bonus questions from totalMarks but adds their score', () => {
    const questions = [
      makeQuestion({ questionId: 'q1', correctAnswer: 'A', isBonus: true }),
      makeQuestion({ questionId: 'q2', correctAnswer: 'B' }),
    ];
    const result = computeAttemptResult(
      questions,
      [
        { questionId: 'q1', question: 'q1', selectedAnswer: 'A' },
        { questionId: 'q2', question: 'q2', selectedAnswer: 'B' },
      ],
      config()
    );

    expect(result.totalMarks).toBe(1);
    expect(result.score).toBe(2);
    expect(result.percentage).toBe(200);
  });

  it('counts empty answers as skipped', () => {
    const questions = [makeQuestion({ questionId: 'q1' })];
    const result = computeAttemptResult(questions, [], config());
    expect(result.skippedQuestions).toBe(1);
    expect(result.correctAnswers).toBe(0);
  });

  it('sets evaluationStatus to pending when manual questions exist', () => {
    const questions = [makeQuestion({ questionId: 'q1', type: 'essay' })];
    const result = computeAttemptResult(
      questions,
      [{ questionId: 'q1', question: 'q1', selectedAnswer: 'My essay' }],
      config()
    );
    expect(result.evaluationStatus).toBe('pending');
  });

  it('marks attempts as auto-submitted when time limit exceeded', () => {
    const questions = [makeQuestion({ questionId: 'q1' })];
    const result = computeAttemptResult(
      questions,
      [{ questionId: 'q1', question: 'q1', selectedAnswer: 'A' }],
      config({
        timeLimit: 1,
        submittedAt: new Date('2026-01-01T00:05:00Z'),
      })
    );
    expect(result.evaluationStatus).toBe('auto_graded');
  });

  it('uses the configured passing score for pass/fail', () => {
    const questions = [
      makeQuestion({ questionId: 'q1', correctAnswer: 'A' }),
      makeQuestion({ questionId: 'q2', correctAnswer: 'B' }),
    ];
    const result = computeAttemptResult(
      questions,
      [
        { questionId: 'q1', question: 'q1', selectedAnswer: 'A' },
        { questionId: 'q2', question: 'q2', selectedAnswer: 'C' },
      ],
      config({ passingScore: 40 })
    );

    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(true);
    expect(result.passFail).toBe('pass');
  });

  it('fails when score is below the configured passing score', () => {
    const questions = [makeQuestion({ questionId: 'q1', correctAnswer: 'A' })];
    const result = computeAttemptResult(
      questions,
      [{ questionId: 'q1', question: 'q1', selectedAnswer: 'B' }],
      config({ passingScore: 80 })
    );
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.passFail).toBe('fail');
  });

  it('passes automatically when the passing score is zero', () => {
    const questions = [makeQuestion({ questionId: 'q1', correctAnswer: 'A' })];
    const result = computeAttemptResult(questions, [], config({ passingScore: 0 }));
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(true);
  });

  it('applies negative marking to the final score', () => {
    const questions = [
      makeQuestion({ questionId: 'q1', correctAnswer: 'A', negativeMarks: 1 }),
      makeQuestion({ questionId: 'q2', correctAnswer: 'B', negativeMarks: 1 }),
    ];
    const result = computeAttemptResult(
      questions,
      [
        { questionId: 'q1', question: 'q1', selectedAnswer: 'A' },
        { questionId: 'q2', question: 'q2', selectedAnswer: 'C' },
      ],
      config({ negativeMarking: true })
    );

    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
  });
});

describe('computeAttemptScoreByPolicy', () => {
  const attempts = [
    { score: 5, totalMarks: 10, percentage: 50 },
    { score: 9, totalMarks: 10, percentage: 90 },
    { score: 7, totalMarks: 10, percentage: 70 },
  ];

  it('picks the best by percentage', () => {
    expect(computeAttemptScoreByPolicy(attempts, 'best').percentage).toBe(90);
  });

  it('picks the latest attempt', () => {
    expect(computeAttemptScoreByPolicy(attempts, 'latest').percentage).toBe(70);
  });

  it('picks the highest by score', () => {
    expect(computeAttemptScoreByPolicy(attempts, 'highest').score).toBe(9);
  });

  it('computes the average', () => {
    const result = computeAttemptScoreByPolicy(attempts, 'average');
    expect(result.score).toBe(21);
    expect(result.percentage).toBe(70);
  });

  it('returns zeros for empty input', () => {
    expect(computeAttemptScoreByPolicy([], 'best')).toEqual({ score: 0, totalMarks: 0, percentage: 0 });
  });
});

describe('resolveQuizQuestions', () => {
  it('normalizes quiz questions', () => {
    const lecture: any = {
      quiz: {
        questions: [{ question: 'Q?', options: ['A', 'B'], correctAnswer: 'A', type: 'single', marks: 2 }],
      },
    };
    const questions = resolveQuizQuestions(lecture);
    expect(questions[0].questionId).toBe('q_0');
    expect(questions[0].marks).toBe(2);
  });

  it('falls back to legacy assignment JSON', () => {
    const lecture: any = {
      assignment: {
        question: JSON.stringify([{ question: 'Legacy?', options: ['A', 'B'], correctAnswer: 'A' }]),
      },
    };
    const questions = resolveQuizQuestions(lecture);
    expect(questions[0].questionId).toBe('legacy_0');
    expect(questions[0].type).toBe('single');
  });

  it('returns empty array when nothing matches', () => {
    expect(resolveQuizQuestions({} as any)).toEqual([]);
  });
});

describe('attemptToCsvRow', () => {
  it('produces a full CSV row', () => {
    const row = attemptToCsvRow({
      _id: 'attempt1',
      user: { _id: 'u1', name: 'Jane', email: 'jane@test.com' },
      course: { _id: 'c1', title: 'Course' },
      lecture: { _id: 'l1', title: 'Lecture' },
      quizTitle: 'Quiz 1',
      attemptNumber: 1,
      score: 9,
      totalMarks: 10,
      percentage: 90,
      passed: true,
      letterGrade: 'A',
      correctAnswers: 9,
      incorrectAnswers: 1,
      skippedQuestions: 0,
      timeTaken: 120,
      timeLimit: 10,
      autoSubmitted: false,
      evaluationStatus: 'published',
      startedAt: new Date(),
      submittedAt: new Date(),
      gradedBy: { _id: 'g1', name: 'Instructor' },
      publishedAt: new Date(),
    } as any);

    expect(row).toHaveLength(23);
    expect(row[3]).toBe('jane@test.com');
    expect(row[4]).toBe('Course');
    expect(row[11]).toBe('A');
    expect(row[21]).toBe('Instructor');
  });
});
