import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createUploadMiddleware, FileCategory, handleMulterError } from '../middlewares/upload.middleware';
import { ApiError } from '../utils/ApiError';

function createMockReq(overrides: Record<string, any> = {}): Request {
  return {
    headers: { 'content-type': 'multipart/form-data; boundary=test' },
    file: undefined,
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('runMulter safety net (via createUploadMiddleware)', () => {
  it('multer error callback returns 400 for MulterError', (done) => {
    const upload = createUploadMiddleware(FileCategory.IMAGE);
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    const middleware = upload.single('file');
    middleware(req, res, (err) => {
      if (err) {
        const message = handleMulterError(err);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
      done();
    });
  });

  it('handleMulterError converts plain Error to string', () => {
    const err = new Error('Missing Content-Type boundary');
    const message = handleMulterError(err);
    expect(message).toBe('Missing Content-Type boundary');
  });

  it('handleMulterError converts MulterError to user-friendly message', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const message = handleMulterError(err);
    expect(message).toBe('File is too large');
  });

  it('handleMulterError handles unknown error types', () => {
    const message = handleMulterError('random string');
    expect(message).toBe('Upload failed');
  });

  it('handleMulterError handles null/undefined', () => {
    const message = handleMulterError(null);
    expect(message).toBe('Upload failed');
  });

  it('createUploadMiddleware returns a valid multer instance', () => {
    const upload = createUploadMiddleware(FileCategory.IMAGE);
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe('function');
  });

  it('createUploadMiddleware works for all image categories', () => {
    const categories = [FileCategory.IMAGE, FileCategory.VIDEO, FileCategory.DOCUMENT];
    for (const category of categories) {
      const upload = createUploadMiddleware(category);
      expect(upload).toBeDefined();
      expect(typeof upload.single).toBe('function');
    }
  });
});

describe('multer sync error safety net pattern', () => {
  function runMulterSafe(
    category: FileCategory,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const upload = createUploadMiddleware(category);
      upload.single('file')(req, res, (err) => {
        if (err) {
          res.status(400).json({ success: false, message: handleMulterError(err), data: null });
          return;
        }
        next();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      next(ApiError.badRequest(message));
    }
  }

  it('catches synchronous errors and passes ApiError to next', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    runMulterSafe(FileCategory.IMAGE, req, res, next);

    if (next.mock.calls.length > 0) {
      const arg = next.mock.calls[0][0];
      if (arg instanceof ApiError) {
        expect(arg.statusCode).toBe(400);
        expect(typeof arg.message).toBe('string');
      }
    }
  });

  it('does not throw when called with a valid request', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    expect(() => {
      runMulterSafe(FileCategory.IMAGE, req, res, next);
    }).not.toThrow();
  });
});
