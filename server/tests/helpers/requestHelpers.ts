import type { Request, Response, NextFunction } from 'express';

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    body: {},
    query: {},
    params: {},
    cookies: {},
    get: vi.fn(),
    ...overrides,
  } as unknown as Request;
}

export interface MockResponse {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  cookie: ReturnType<typeof vi.fn>;
  clearCookie: ReturnType<typeof vi.fn>;
  redirect: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

export function mockResponse(): MockResponse {
  const res: MockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res;
}

export function mockNext(): ReturnType<typeof vi.fn> {
  return vi.fn();
}

export function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void | Promise<void>,
  req: Request = mockRequest(),
  res: Response = mockResponse() as unknown as Response,
  next: NextFunction = mockNext(),
): { req: Request; res: Response; next: ReturnType<typeof vi.fn> } {
  middleware(req, res, next);
  return { req, res, next };
}
