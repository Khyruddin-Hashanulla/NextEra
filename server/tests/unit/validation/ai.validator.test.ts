import {
  generateDescriptionSchema,
  generateQuizSchema,
  generateAssignmentSchema,
  chatSchema,
} from '../../../src/validators/ai.validator';

describe('ai.validator', () => {
  it('validates description generation', () => {
    const valid = { body: { title: 'Intro to AI', category: 'AI', level: 'beginner', keywords: ['ml'] } };
    expect(generateDescriptionSchema.parse(valid).body.keywords).toEqual(['ml']);
    expect(generateDescriptionSchema.parse({ body: { title: 'x', category: 'y', level: 'z' } }).body.keywords).toEqual(
      []
    );
    expect(() => generateDescriptionSchema.parse({ body: { title: '', category: '', level: '' } })).toThrow();
  });

  it('validates quiz generation with defaults', () => {
    const valid = { body: { topic: 'Math', count: 10, difficulty: 'hard' } };
    expect(generateQuizSchema.parse(valid).body.count).toBe(10);
    expect(generateQuizSchema.parse({ body: { topic: 'Math' } }).body).toMatchObject({
      count: 5,
      difficulty: 'medium',
    });
    expect(() => generateQuizSchema.parse({ body: { topic: 'Math', count: 21 } })).toThrow();
    expect(() => generateQuizSchema.parse({ body: { topic: '' } })).toThrow();
  });

  it('validates assignment generation', () => {
    const valid = { body: { topic: 'Algorithms', duration: '2h', skills: ['sorting'] } };
    expect(generateAssignmentSchema.parse(valid).body.skills).toEqual(['sorting']);
    expect(() => generateAssignmentSchema.parse({ body: { topic: 'x', duration: 'y', skills: [] } })).toThrow();
  });

  it('validates chat messages and history', () => {
    const valid = {
      body: {
        message: 'Hello',
        history: [{ role: 'user', content: 'hi' }],
      },
    };
    expect(chatSchema.parse(valid).body.message).toBe('Hello');
    expect(chatSchema.parse({ body: { message: 'Hello' } }).body.history).toEqual([]);
    expect(() => chatSchema.parse({ body: { message: '' } })).toThrow();
    expect(() => chatSchema.parse({ body: { message: 'hi', history: [{ role: 'system', content: 'x' }] } })).toThrow();
  });
});
