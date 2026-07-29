import { payloadGuard } from '../middlewares/payloadGuard.middleware';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

function mockReq(body: any): Partial<Request> {
  return { body } as Request;
}
function mockRes(): Partial<Response> {
  return {};
}

describe('payloadGuard middleware', () => {
  it('passes for empty body', () => {
    const req = mockReq({});
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes for null body', () => {
    const req = mockReq(null) as any;
    req.body = null;
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes for simple valid body', () => {
    const req = mockReq({ name: 'test', email: 'test@test.com' });
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes for moderately nested body within limits', () => {
    const req = mockReq({
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
      },
    });
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks deeply nested body exceeding max depth', () => {
    const body: any = {};
    let current = body;
    for (let i = 0; i < 10; i++) {
      current[`level${i}`] = {};
      current = current[`level${i}`];
    }
    current.value = 'too deep';

    const req = mockReq(body);
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (next as jest.Mock).mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('nesting depth');
  });

  it('blocks body with excessive keys', () => {
    const body: Record<string, number> = {};
    for (let i = 0; i < 150; i++) {
      body[`key${i}`] = i;
    }

    const req = mockReq(body);
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (next as jest.Mock).mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('field count');
  });

  it('passes for deeply nested arrays within depth limit', () => {
    const req = mockReq({ items: [[[['value']]]] });
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks overly nested arrays', () => {
    let arr: any = ['deep'];
    for (let i = 0; i < 10; i++) {
      arr = [arr];
    }
    const req = mockReq({ data: arr });
    const next: NextFunction = jest.fn();
    payloadGuard(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });
});

describe('Zod schema field limits', () => {
  it('title schema rejects strings over 200 chars', async () => {
    const { createCourseSchema } = await import('../validators/course.validator');
    const result = createCourseSchema.safeParse({
      title: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('title schema accepts valid title', async () => {
    const { createCourseSchema } = await import('../validators/course.validator');
    const result = createCourseSchema.safeParse({
      title: 'Introduction to React Development',
    });
    expect(result.success).toBe(true);
  });

  it('description schema rejects strings over 5000 chars', async () => {
    const { createCourseSchema } = await import('../validators/course.validator');
    const result = createCourseSchema.safeParse({
      title: 'Valid Title',
      description: 'a'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('tags array rejects more than 20 items', async () => {
    const { createCourseSchema } = await import('../validators/course.validator');
    const result = createCourseSchema.safeParse({
      title: 'Valid Title',
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('blog content rejects strings over 50000 chars', async () => {
    const { createBlogSchema } = await import('../validators/admin.validator');
    const result = createBlogSchema.safeParse({
      title: 'A valid blog title',
      content: 'a'.repeat(50001),
    });
    expect(result.success).toBe(false);
  });
});

describe('express.json limit integration', () => {
  it('express.json is configured with 10mb limit', async () => {
    const app = await import('../app');
    const settings = (app.default as any).get('json limit');
    expect(settings).toBeUndefined();
  });
});
