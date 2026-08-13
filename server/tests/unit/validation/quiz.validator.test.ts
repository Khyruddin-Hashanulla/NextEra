import {
  startQuizSchema,
  submitQuizSchema,
  updateQuizStatusSchema,
  overrideGradeSchema,
  publishGradeSchema,
  quizAnalyticsQuerySchema,
  quizExportQuerySchema,
  quizAttemptQuerySchema,
  resumeQuizSchema,
  autoSubmitQuizSchema,
} from '../../../src/validators/quiz.validator';

const gradedFile = { url: 'u', publicId: 'p', name: 'n' };
const rubricItem = { criteria: 'Accuracy', maxPoints: 5, obtainedPoints: 4, comment: 'c' };

describe('quiz.validator', () => {
  it('validates quiz start', () => {
    expect(startQuizSchema.parse({ body: { courseId: 'c', lectureId: 'l' } }).body.lectureId).toBe('l');
    expect(() => startQuizSchema.parse({ body: { courseId: '', lectureId: '' } })).toThrow();
  });

  it('validates quiz submissions', () => {
    const valid = {
      body: {
        attemptId: 'a1',
        answers: [
          { questionId: 'q1', question: 'What is 2+2?', selectedAnswer: '4' },
          { question: 'Is the sky blue?', selectedAnswer: 'yes' },
        ],
        autoSubmitted: true,
      },
    };
    expect(submitQuizSchema.parse(valid).body.answers).toHaveLength(2);
    expect(() => submitQuizSchema.parse({ body: { attemptId: '', answers: [] } })).toThrow();
  });

  it('validates quiz status updates', () => {
    expect(updateQuizStatusSchema.parse({ body: { status: 'graded', remark: 'r' } }).body.status).toBe('graded');
    expect(() => updateQuizStatusSchema.parse({ body: { status: 'bogus' } })).toThrow();
  });

  it('validates quiz grade overrides', () => {
    const valid = {
      body: {
        grade: 9,
        feedback: 'good',
        letterGrade: 'A',
        publish: true,
        gradedFiles: [gradedFile],
        rubric: [rubricItem],
        resubmissionDeadline: '2026-01-01T00:00:00.000Z',
      },
    };
    expect(overrideGradeSchema.parse(valid).body.grade).toBe(9);
    expect(overrideGradeSchema.parse({ body: {} }).body).toEqual({});
    expect(() => overrideGradeSchema.parse({ body: { resubmissionDeadline: 'nope' } })).toThrow();
  });

  it('validates publishing grades', () => {
    expect(publishGradeSchema.parse({ body: { publishedBy: 'i1' } }).body.publishedBy).toBe('i1');
    expect(() => publishGradeSchema.parse({ body: { publishedBy: '' } })).toThrow();
  });

  it('validates analytics query with coercion', () => {
    expect(quizAnalyticsQuerySchema.parse({ query: {} }).query).toMatchObject({ page: 1, limit: 20 });
    expect(quizAnalyticsQuerySchema.parse({ query: { page: 'bad', limit: 'x' } }).query).toMatchObject({
      page: 1,
      limit: 20,
    });
    expect(
      quizAnalyticsQuerySchema.parse({ query: { lectureId: 'l', courseId: 'c', search: 's', sort: 'score-desc' } })
        .query.sort
    ).toBe('score-desc');
  });

  it('validates export query', () => {
    expect(quizExportQuerySchema.parse({ query: { lectureId: 'l', courseId: 'c' } }).query.courseId).toBe('c');
    expect(() => quizExportQuerySchema.parse({ query: { startDate: 'nope' } })).toThrow();
  });

  it('validates attempt query', () => {
    expect(quizAttemptQuerySchema.parse({ query: {} }).query).toMatchObject({ page: 1, limit: 20 });
    expect(
      quizAttemptQuerySchema.parse({ query: { status: 'graded', attemptNumber: '2', search: 's', sort: 'score-asc' } })
        .query.attemptNumber
    ).toBe(2);
    expect(() => quizAttemptQuerySchema.parse({ query: { status: 'bogus' } })).toThrow();
  });

  it('validates resume and auto-submit', () => {
    expect(resumeQuizSchema.parse({ body: { attemptId: 'a1' } }).body.attemptId).toBe('a1');
    expect(() => resumeQuizSchema.parse({ body: { attemptId: '' } })).toThrow();
    expect(autoSubmitQuizSchema.parse({ body: { attemptId: 'a1' } }).body.attemptId).toBe('a1');
  });
});
