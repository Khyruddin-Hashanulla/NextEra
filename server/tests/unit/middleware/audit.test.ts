import { audit, auditMiddleware, previousDataLoader, AuditOptions } from '../../../src/middlewares/audit.middleware';
import { auditService } from '../../../src/services/audit.service';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/services/audit.service', () => ({
  auditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../src/services/dataScoping.service', () => ({
  getIp: vi.fn(() => '1.2.3.4'),
  getUserAgent: vi.fn(() => 'test-agent'),
}));

describe('audit middleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function resWithLocals(): any {
    const res = mockResponse() as any;
    res.locals = {};
    return res;
  }

  it('audit() stores options on res.locals and calls next', () => {
    const req = mockRequest();
    const res = resWithLocals();
    const next = mockNext();
    const opts: AuditOptions = { action: 'create', resourceType: 'Course' };
    const handler = audit(opts);
    handler(req, res, next);
    expect(res.locals.audit).toBe(opts);
    expect(next).toHaveBeenCalledOnce();
  });

  it('auditMiddleware passes through without logging when no current user', async () => {
    const req = mockRequest() as any;
    const res = resWithLocals();
    const next = mockNext();
    auditMiddleware(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('auditMiddleware logs on response and returns the original json', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      method: 'POST',
      originalUrl: '/api/courses',
      baseUrl: '/api',
      route: { path: '/courses' },
      id: 'req-1',
    }) as any;
    const res = resWithLocals();
    const body = { success: true, data: { title: 'React' } };
    res.locals.audit = { action: 'create', resourceType: 'Course' };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.statusCode = 201;
    const result = res.json(body);

    expect(result).toBeDefined();
    await new Promise((r) => setTimeout(r, 0));
    expect(auditService.log).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'a1',
        adminEmail: 'admin@x.com',
        action: 'create',
        resourceType: 'Course',
        statusCode: 201,
        success: true,
        requestMethod: 'POST',
        ipAddress: '1.2.3.4',
        userAgent: 'test-agent',
        requestId: 'req-1',
        route: '/courses',
      })
    );
  });

  it('records an error message for failed responses', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      originalUrl: '/api/courses',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = { action: 'delete', resourceType: 'Course' };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.statusCode = 404;
    res.json({ message: 'Course not found' });
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, success: false, errorMessage: 'Course not found' })
    );
  });

  it('uses the Unknown error fallback when a failed response has no message', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      originalUrl: '/api/courses',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = { action: 'delete', resourceType: 'Course' };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.statusCode = 500;
    res.json({});
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errorMessage: 'Unknown error' })
    );
  });

  it('does not log when there is no audit options on res.locals', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      originalUrl: '/api/courses',
    }) as any;
    const res = resWithLocals();
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.json({ ok: true });
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('uses getPreviousData and getNewData when provided', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      originalUrl: '/api/courses',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = {
      action: 'update',
      resourceType: 'Course',
      getPreviousData: async () => ({ title: 'Old' }),
      getNewData: () => ({ title: 'New' }),
    };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.statusCode = 200;
    res.json({ success: true });
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ previousData: { title: 'Old' }, newData: { title: 'New' } })
    );
  });

  it('extracts nested data from body.data.data responses', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      originalUrl: '/api/courses',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = { action: 'create', resourceType: 'Course' };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.statusCode = 201;
    res.json({ success: true, data: { data: { title: 'React' } } });
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ newData: { title: 'React' } }));
  });

  it('falls back to baseUrl when the route has no path', async () => {
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'admin@x.com' } as never,
      originalUrl: '/api/courses',
      baseUrl: '/api',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = { action: 'get', resourceType: 'Course' };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.json({ ok: true });
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ route: '/api' }));
  });

  it('supports function-based action, resourceId and resourceName', async () => {
    const req = mockRequest({
      params: { id: 'c1' },
      currentUser: { userId: 'a1', email: 'a@b.com' } as never,
      originalUrl: '/x',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = {
      action: (r: any, body: any) => `update_${body.version}`,
      resourceType: 'Course',
      resourceId: (r: any) => `course_${r.params.id}`,
      resourceName: () => 'My Course',
    };
    const next = mockNext();

    auditMiddleware(req, res, next);
    res.statusCode = 200;
    res.json({ success: true, version: 2 });
    await new Promise((r) => setTimeout(r, 0));

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update_2',
        resourceId: 'course_c1',
        resourceName: 'My Course',
      })
    );
  });

  it('uses previousDataLoader to capture pre-change data', async () => {
    const model = { findById: vi.fn() } as never;
    const loader = previousDataLoader(model as never);
    const req = mockRequest({ params: { id: '507f1f77bcf86cd799439011' } }) as any;
    vi.mocked((model as any).findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ title: 'Old' }),
    });
    await expect(loader(req)).resolves.toEqual({ title: 'Old' });
  });

  it('previousDataLoader returns undefined for invalid ids', async () => {
    const model = { findById: vi.fn() } as never;
    const loader = previousDataLoader(model as never);
    const req = mockRequest({ params: { id: 'not-valid' } }) as any;
    await expect(loader(req)).resolves.toBeUndefined();
    expect((model as any).findById).not.toHaveBeenCalled();
  });

  it('previousDataLoader returns undefined when the doc is not found', async () => {
    const model = { findById: vi.fn() } as never;
    const loader = previousDataLoader(model as never);
    const req = mockRequest({ params: { id: '507f1f77bcf86cd799439011' } }) as any;
    vi.mocked((model as any).findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    await expect(loader(req)).resolves.toBeUndefined();
  });

  it('does not throw when audit logging fails', async () => {
    vi.mocked(auditService.log).mockRejectedValueOnce(new Error('db down'));
    const req = mockRequest({
      currentUser: { userId: 'a1', email: 'a@b.com' } as never,
      originalUrl: '/x',
    }) as any;
    const res = resWithLocals();
    res.locals.audit = { action: 'x', resourceType: 'Y' };
    const next = mockNext();

    auditMiddleware(req, res, next);
    expect(() => res.json({ ok: true })).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});
