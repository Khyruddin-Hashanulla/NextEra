import {
  gradeSubmissionSchema,
  updateSubmissionStatusSchema,
  returnForResubmissionSchema,
  overrideGradeSchema,
  submitAssignmentSchema,
  assignmentsOverviewQuerySchema,
  submissionsListQuerySchema,
} from '../../../src/validators/assignment.validator';

const assignmentFile = { url: 'u', publicId: 'p', name: 'file.pdf' };
const rubricItem = { criteria: 'Correctness', maxPoints: 10, obtainedPoints: 8, comment: 'good' };

describe('assignment.validator', () => {
  it('validates grading a submission', () => {
    const valid = {
      body: {
        grade: 8,
        maxMarks: 10,
        feedback: 'nice',
        privateNotes: 'note',
        letterGrade: 'A',
        customGradeScale: 'scale',
        rubric: [rubricItem],
        gradedFiles: [assignmentFile],
        publish: true,
      },
    };
    expect(gradeSubmissionSchema.parse(valid).body.grade).toBe(8);
    expect(() => gradeSubmissionSchema.parse({ body: { grade: -1 } })).toThrow();
  });

  it('validates submission status updates', () => {
    expect(updateSubmissionStatusSchema.parse({ body: { status: 'rejected', privateNotes: 'n' } }).body.status).toBe(
      'rejected'
    );
    expect(() => updateSubmissionStatusSchema.parse({ body: { status: 'nope' } })).toThrow();
  });

  it('validates return for resubmission', () => {
    const valid = {
      body: { feedback: 'redo', privateNotes: 'n', resubmissionDeadline: '2026-01-01T00:00:00.000Z' },
    };
    expect(returnForResubmissionSchema.parse(valid).body.feedback).toBe('redo');
    expect(() => returnForResubmissionSchema.parse({ body: { resubmissionDeadline: 'not-a-date' } })).toThrow();
  });

  it('validates grade override', () => {
    const valid = { body: { grade: 9, maxMarks: 10, rubric: [rubricItem], gradedFiles: [assignmentFile] } };
    expect(overrideGradeSchema.parse(valid).body.maxMarks).toBe(10);
    expect(() => overrideGradeSchema.parse({ body: { maxMarks: 0 } })).toThrow();
  });

  it('validates assignment submissions', () => {
    const valid = { body: { courseId: 'c1', lectureId: 'l1', content: 'x', files: [assignmentFile] } };
    expect(submitAssignmentSchema.parse(valid).body.courseId).toBe('c1');
    expect(() => submitAssignmentSchema.parse({ body: { courseId: '', lectureId: '' } })).toThrow();
  });

  it('validates overview query with coercion and defaults', () => {
    expect(assignmentsOverviewQuerySchema.parse({ query: {} }).query).toMatchObject({ page: 1, limit: 20 });
    expect(assignmentsOverviewQuerySchema.parse({ query: { page: '3', limit: '50' } }).query).toMatchObject({
      page: 3,
      limit: 50,
    });
    expect(assignmentsOverviewQuerySchema.parse({ query: { page: 'bad', limit: '99999' } }).query).toMatchObject({
      page: 1,
      limit: 20,
    });
    expect(
      assignmentsOverviewQuerySchema.parse({ query: { courseId: 'c1', status: 'submitted' } }).query.courseId
    ).toBe('c1');
  });

  it('validates submissions list query', () => {
    expect(submissionsListQuerySchema.parse({ query: {} }).query).toMatchObject({ page: 1, limit: 20 });
    expect(
      submissionsListQuerySchema.parse({ query: { status: 'graded', search: 'x', sort: '-grade' } }).query.sort
    ).toBe('-grade');
    expect(() => submissionsListQuerySchema.parse({ query: { sort: 'bogus' } })).toThrow();
  });
});
