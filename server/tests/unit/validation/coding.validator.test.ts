import {
  createCodingProblemSchema,
  updateCodingProblemSchema,
  submitCodeSchema,
  listCodingProblemsQuerySchema,
} from '../../../src/validators/coding.validator';

const testCase = { input: '1', expectedOutput: '2', isSample: true, explanation: 'e' };

describe('coding.validator', () => {
  it('validates coding problem creation with defaults', () => {
    const valid = {
      body: {
        title: 'Two Sum',
        description: 'Find the pair',
        difficulty: 'easy',
        tags: ['array'],
        categories: ['algo'],
        supportedLanguages: ['javascript'],
        timeLimit: 2,
        memoryLimit: 256,
        testCases: [testCase],
        solutionTemplate: { javascript: 'fn' },
        solutionApproach: 'sort',
        instructorSolution: 'code',
        course: 'c1',
        lecture: 'l1',
        isPublished: true,
      },
    };
    const parsed = createCodingProblemSchema.parse(valid);
    expect(parsed.body.difficulty).toBe('easy');
    expect(parsed.body.isPublished).toBe(true);
    expect(() => createCodingProblemSchema.parse({ body: { title: '', description: '', difficulty: 'easy', testCases: [] } })).toThrow();
  });

  it('applies coding problem defaults', () => {
    const parsed = createCodingProblemSchema.parse({
      body: { title: 'x', description: 'y', difficulty: 'hard', testCases: [{ input: 'a', expectedOutput: 'b' }] },
    });
    expect(parsed.body.tags).toEqual([]);
    expect(parsed.body.supportedLanguages).toEqual(['javascript', 'python']);
    expect(parsed.body.timeLimit).toBe(2);
    expect(parsed.body.memoryLimit).toBe(256);
    expect(parsed.body.solutionTemplate).toEqual({});
    expect(parsed.body.isPublished).toBe(false);
    expect(parsed.body.testCases[0].isSample).toBe(false);
  });

  it('validates coding problem updates', () => {
    expect(updateCodingProblemSchema.parse({ body: { title: 'New', difficulty: 'medium' } }).body.difficulty).toBe(
      'medium',
    );
    expect(() => updateCodingProblemSchema.parse({ body: { memoryLimit: 4 } })).toThrow();
  });

  it('validates code submission', () => {
    expect(submitCodeSchema.parse({ body: { code: 'print(1)', language: 'python' } }).body.isPractice).toBe(true);
    expect(submitCodeSchema.parse({ body: { code: 'print(1)', language: 'python', isPractice: false } }).body.isPractice).toBe(false);
    expect(() => submitCodeSchema.parse({ body: { code: '', language: 'cobol' } })).toThrow();
  });

  it('validates list query with defaults and filters', () => {
    expect(listCodingProblemsQuerySchema.parse({ query: {} }).query).toMatchObject({
      page: '1',
      limit: '20',
      sort: 'newest',
    });
    expect(
      listCodingProblemsQuerySchema.parse({ query: { difficulty: 'hard', tag: 't', category: 'c', course: 'co', page: '2', limit: '5', search: 's', sort: 'submissions' } }).query,
    ).toMatchObject({ page: '2', limit: '5', sort: 'submissions' });
    expect(() => listCodingProblemsQuerySchema.parse({ query: { sort: 'bogus' } })).toThrow();
  });
});
