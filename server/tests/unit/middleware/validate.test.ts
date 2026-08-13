import { z } from 'zod';
import { ApiError } from '../../../src/utils/ApiError';
import { validate } from '../../../src/middlewares/validate.middleware';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const wrappedSchema = z.object({
  body: z.object({ title: z.string().min(2) }),
});

// superRefine/refine produce a ZodEffects wrapper that has no `.shape`; the
// middleware must still detect a `{ body: ... }` wrapper (see "body: Required" bug).
const refinedWrappedSchema = z
  .object({
    body: z.object({ title: z.string().min(2), price: z.number() }),
  })
  .superRefine((val, ctx) => {
    if (val.body.price > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['body', 'price'], message: 'too expensive' });
    }
  });

describe('validate middleware', () => {
  it('passes through valid body data', () => {
    const req = mockRequest({ body: { email: 'a@b.com', password: 'secret1' } });
    const next = mockNext();
    validate(loginSchema)(req, mockResponse() as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.body).toEqual({ email: 'a@b.com', password: 'secret1' });
  });

  it('calls next with an ApiError on ZodError', () => {
    const req = mockRequest({ body: { email: 'bad', password: 'x' } });
    const next = mockNext();
    validate(loginSchema)(req, mockResponse() as never, next);
    const err = next.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('email');
    expect(err.message).toContain('password');
  });

  it('validates the query source', () => {
    const schema = z.object({ page: z.coerce.number().positive() });
    const ok = mockRequest({ query: { page: '2' } });
    const bad = mockRequest({ query: { page: '-1' } });
    const okNext = mockNext();
    const badNext = mockNext();

    validate(schema, 'query')(ok, mockResponse() as never, okNext);
    validate(schema, 'query')(bad, mockResponse() as never, badNext);

    expect(okNext.mock.calls[0][0]).toBeUndefined();
    expect(badNext.mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  it('validates the params source', () => {
    const schema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
    const req = mockRequest({ params: { id: 'zzz' } });
    const next = mockNext();
    validate(schema, 'params')(req, mockResponse() as never, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  it('unwraps single-key wrapped schemas', () => {
    const req = mockRequest({ body: { title: 'ok' } });
    const next = mockNext();
    validate(wrappedSchema)(req, mockResponse() as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('unwraps wrapped schemas produced by superRefine (ZodEffects)', () => {
    const ok = mockRequest({ body: { title: 'ok', price: 50 } });
    const okNext = mockNext();
    validate(refinedWrappedSchema)(ok, mockResponse() as never, okNext);
    expect(okNext.mock.calls[0][0]).toBeUndefined();
    expect(ok.body).toEqual({ title: 'ok', price: 50 });

    const bad = mockRequest({ body: { title: 'ok', price: 200 } });
    const badNext = mockNext();
    validate(refinedWrappedSchema)(bad, mockResponse() as never, badNext);
    const err = badNext.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('price');
  });

  it('assigns parsed values back onto the request', () => {
    const req = mockRequest({ body: { email: '  A@B.COM  ', password: 'secret1' } });
    const next = mockNext();
    validate(loginSchema)(req, mockResponse() as never, next);
    expect(req.body).toEqual({ email: 'A@B.COM', password: 'secret1' });
  });

  it('forwards non-Zod errors', () => {
    const schema = z.string();
    const req = mockRequest({ body: 'x' });
    const next = mockNext();
    const expected = new Error('custom');
    (schema.parse as never) = () => {
      throw expected;
    };
    validate(schema as never)(req, mockResponse() as never, next);
    expect(next).toHaveBeenCalledWith(expected);
  });
});
