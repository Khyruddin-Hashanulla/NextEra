import {
  gradeSubmissionSchema,
  updateSubmissionStatusSchema,
  returnForResubmissionSchema,
  overrideGradeSchema,
  submitAssignmentSchema,
  assignmentsOverviewQuerySchema,
  submissionsListQuerySchema,
} from '../validators/assignment.validator';

const VALID_FILE = { url: 'https://cdn.example.com/a.pdf', publicId: 'abc123', name: 'answer.pdf' };

describe('gradeSubmissionSchema', () => {
  it('accepts a minimal valid grade', () => {
    const r = gradeSubmissionSchema.safeParse({ body: { grade: 85 } });
    expect(r.success).toBe(true);
  });

  it('accepts full grading payload', () => {
    const r = gradeSubmissionSchema.safeParse({
      body: {
        grade: 85,
        maxMarks: 100,
        feedback: 'Great',
        privateNotes: 'Internal',
        letterGrade: 'A',
        customGradeScale: 'Excellent',
        rubric: [{ criteria: 'Clarity', maxPoints: 10, obtainedPoints: 9 }],
        gradedFiles: [VALID_FILE],
        publish: true,
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects negative grade', () => {
    expect(gradeSubmissionSchema.safeParse({ body: { grade: -1 } }).success).toBe(false);
  });

  it('rejects grade over 100000', () => {
    expect(gradeSubmissionSchema.safeParse({ body: { grade: 100001 } }).success).toBe(false);
  });

  it('rejects string grade', () => {
    expect(gradeSubmissionSchema.safeParse({ body: { grade: '85' } }).success).toBe(false);
  });

  it('rejects empty body', () => {
    expect(gradeSubmissionSchema.safeParse({ body: {} }).success).toBe(false);
  });

  it('rejects more than 5 graded files', () => {
    const files = Array.from({ length: 6 }, (_, i) => ({ ...VALID_FILE, publicId: `p${i}` }));
    expect(gradeSubmissionSchema.safeParse({ body: { grade: 1, gradedFiles: files } }).success).toBe(false);
  });
});

describe('updateSubmissionStatusSchema', () => {
  it('accepts under_review', () => {
    expect(updateSubmissionStatusSchema.safeParse({ body: { status: 'under_review' } }).success).toBe(true);
  });

  it('accepts rejected', () => {
    expect(updateSubmissionStatusSchema.safeParse({ body: { status: 'rejected' } }).success).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(updateSubmissionStatusSchema.safeParse({ body: { status: 'graded' } }).success).toBe(false);
  });

  it('rejects missing status', () => {
    expect(updateSubmissionStatusSchema.safeParse({ body: {} }).success).toBe(false);
  });
});

describe('returnForResubmissionSchema', () => {
  it('accepts feedback only', () => {
    expect(returnForResubmissionSchema.safeParse({ body: { feedback: 'Redo' } }).success).toBe(true);
  });

  it('accepts empty body', () => {
    expect(returnForResubmissionSchema.safeParse({ body: {} }).success).toBe(true);
  });

  it('accepts a valid ISO deadline', () => {
    expect(returnForResubmissionSchema.safeParse({ body: { resubmissionDeadline: '2026-08-10T12:00:00.000Z' } }).success).toBe(true);
  });

  it('rejects a non-ISO deadline', () => {
    expect(returnForResubmissionSchema.safeParse({ body: { resubmissionDeadline: 'next week' } }).success).toBe(false);
  });
});

describe('overrideGradeSchema', () => {
  it('accepts valid grade', () => {
    expect(overrideGradeSchema.safeParse({ body: { grade: 90 } }).success).toBe(true);
  });

  it('rejects negative grade', () => {
    expect(overrideGradeSchema.safeParse({ body: { grade: -2 } }).success).toBe(false);
  });

  it('rejects missing grade', () => {
    expect(overrideGradeSchema.safeParse({ body: {} }).success).toBe(false);
  });
});

describe('submitAssignmentSchema', () => {
  it('accepts content only', () => {
    expect(submitAssignmentSchema.safeParse({ body: { courseId: 'c', lectureId: 'l', content: 'Hi' } }).success).toBe(true);
  });

  it('accepts files only (no content)', () => {
    expect(submitAssignmentSchema.safeParse({ body: { courseId: 'c', lectureId: 'l', files: [VALID_FILE] } }).success).toBe(true);
  });

  it('rejects missing courseId', () => {
    expect(submitAssignmentSchema.safeParse({ body: { lectureId: 'l' } }).success).toBe(false);
  });

  it('rejects missing lectureId', () => {
    expect(submitAssignmentSchema.safeParse({ body: { courseId: 'c' } }).success).toBe(false);
  });

  it('rejects malformed file entry', () => {
    expect(submitAssignmentSchema.safeParse({ body: { courseId: 'c', lectureId: 'l', files: [{ url: 'u' }] } }).success).toBe(false);
  });

  it('rejects more than 5 files', () => {
    const files = Array.from({ length: 6 }, (_, i) => ({ ...VALID_FILE, publicId: `p${i}` }));
    expect(submitAssignmentSchema.safeParse({ body: { courseId: 'c', lectureId: 'l', files } }).success).toBe(false);
  });
});

describe('assignmentsOverviewQuerySchema', () => {
  it('defaults page and limit', () => {
    const r = assignmentsOverviewQuerySchema.safeParse({ query: {} });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.query.page).toBe(1);
      expect(r.data.query.limit).toBe(20);
    }
  });

  it('accepts valid status filter', () => {
    expect(assignmentsOverviewQuerySchema.safeParse({ query: { status: 'graded' } }).success).toBe(true);
  });

  it('accepts the computed "overdue" status filter', () => {
    expect(assignmentsOverviewQuerySchema.safeParse({ query: { status: 'overdue' } }).success).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(assignmentsOverviewQuerySchema.safeParse({ query: { status: 'nope' } }).success).toBe(false);
  });

  it('coerces numeric query values', () => {
    const r = assignmentsOverviewQuerySchema.safeParse({ query: { page: '2', limit: '50' } });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.query.page).toBe(2);
      expect(r.data.query.limit).toBe(50);
    }
  });
});

describe('submissionsListQuerySchema', () => {
  it('accepts valid filters', () => {
    expect(submissionsListQuerySchema.safeParse({ query: { status: 'late_submission', sort: '-submittedAt', search: 'alice' } }).success).toBe(true);
  });

  it('rejects invalid sort key', () => {
    expect(submissionsListQuerySchema.safeParse({ query: { sort: 'bogus' } }).success).toBe(false);
  });

  it('rejects unknown status', () => {
    expect(submissionsListQuerySchema.safeParse({ query: { status: 'x' } }).success).toBe(false);
  });
});
