import {
  createBlogCommentSchema,
  updateBlogCommentSchema,
} from '../../../src/validators/blog.validator';

describe('blog.validator', () => {
  it('validates comment creation', () => {
    expect(createBlogCommentSchema.parse({ body: { content: 'nice post', parent: 'p1' } }).body.content).toBe(
      'nice post',
    );
    expect(createBlogCommentSchema.parse({ body: { content: 'nice post' } }).body.parent).toBeUndefined();
    expect(() => createBlogCommentSchema.parse({ body: { content: '' } })).toThrow();
  });

  it('validates comment updates', () => {
    expect(updateBlogCommentSchema.parse({ body: { content: 'edited' } }).body.content).toBe('edited');
    expect(() => updateBlogCommentSchema.parse({ body: { content: '' } })).toThrow();
  });
});
