import {
  initiatePaymentSchema,
  verifyPaymentSchema,
  updateProgressSchema,
  createNoteSchema,
  updateNoteSchema,
  toggleBookmarkSchema,
  createDiscussionSchema,
  replyToDiscussionSchema,
  createReviewSchema,
  submitAssignmentSchema,
  submitQuizSchema,
} from '../../../src/validators/student.validator';

describe('student.validator', () => {
  it('validates payment initiation and verification', () => {
    expect(initiatePaymentSchema.parse({ body: { courseId: 'c1', couponCode: 'SAVE' } }).body.couponCode).toBe('SAVE');
    expect(() => initiatePaymentSchema.parse({ body: { courseId: '' } })).toThrow();
    const valid = { body: { razorpayOrderId: 'o', razorpayPaymentId: 'p', razorpaySignature: 's' } };
    expect(verifyPaymentSchema.parse(valid).body.razorpayOrderId).toBe('o');
    expect(() => verifyPaymentSchema.parse({ body: {} })).toThrow();
  });

  it('validates progress updates', () => {
    const valid = { body: { lectureId: 'l1', position: 120, completed: true, duration: 200 } };
    expect(updateProgressSchema.parse(valid).body.completed).toBe(true);
    expect(() => updateProgressSchema.parse({ body: { lectureId: '', position: -1 } })).toThrow();
  });

  it('validates notes', () => {
    const valid = { body: { courseId: 'c', lectureId: 'l', content: 'note', timestamp: 10 } };
    expect(createNoteSchema.parse(valid).body.content).toBe('note');
    expect(() => createNoteSchema.parse({ body: { courseId: '', lectureId: '', content: '' } })).toThrow();
    expect(updateNoteSchema.parse({ body: { content: 'updated', timestamp: 5 } }).body.content).toBe('updated');
    expect(() => updateNoteSchema.parse({ body: { content: '' } })).toThrow();
  });

  it('validates bookmarks', () => {
    expect(toggleBookmarkSchema.parse({ body: { courseId: 'c', lectureId: 'l' } }).body.courseId).toBe('c');
    expect(() => toggleBookmarkSchema.parse({ body: {} })).toThrow();
  });

  it('validates discussions', () => {
    const valid = { body: { courseId: 'c', lectureId: 'l', title: 'Question', content: 'How do I...' } };
    expect(createDiscussionSchema.parse(valid).body.title).toBe('Question');
    expect(() => createDiscussionSchema.parse({ body: { courseId: '', title: '', content: '' } })).toThrow();
    expect(replyToDiscussionSchema.parse({ body: { content: 'reply' } }).body.content).toBe('reply');
    expect(() => replyToDiscussionSchema.parse({ body: { content: '' } })).toThrow();
  });

  it('validates reviews', () => {
    expect(createReviewSchema.parse({ body: { courseId: 'c', rating: 5, review: 'great' } }).body.rating).toBe(5);
    expect(() => createReviewSchema.parse({ body: { courseId: 'c', rating: 6 } })).toThrow();
  });

  it('validates assignment submissions', () => {
    const valid = {
      body: {
        courseId: 'c',
        lectureId: 'l',
        content: 'x',
        files: [{ url: 'u', publicId: 'p', name: 'n' }],
      },
    };
    expect(submitAssignmentSchema.parse(valid).body.files).toHaveLength(1);
    expect(() => submitAssignmentSchema.parse({ body: { courseId: '', lectureId: '' } })).toThrow();
  });

  it('validates quiz submissions', () => {
    const valid = {
      body: {
        courseId: 'c',
        lectureId: 'l',
        answers: [{ question: 'q', selectedAnswer: 'a' }],
      },
    };
    expect(submitQuizSchema.parse(valid).body.answers).toHaveLength(1);
    expect(() => submitQuizSchema.parse({ body: { courseId: '', lectureId: '', answers: [] } })).toThrow();
  });
});
