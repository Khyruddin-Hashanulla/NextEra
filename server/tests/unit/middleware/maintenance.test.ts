import { maintenanceMode } from '../../../src/middlewares/maintenance.middleware';
import { PlatformSettings } from '../../../src/models/platformSettings.model';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/models/platformSettings.model', () => ({
  PlatformSettings: { findOne: vi.fn() },
}));

const findOne = vi.mocked(PlatformSettings.findOne as never);

function chain(value: unknown) {
  const q = Promise.resolve(value) as any;
  q.lean = vi.fn().mockResolvedValue(value);
  return q;
}

function run(req: ReturnType<typeof mockRequest>) {
  const res = mockResponse();
  const next = mockNext();
  const promise = maintenanceMode(req, res as never, next);
  return { res, next, promise };
}

describe('maintenanceMode middleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips admin and auth routes', async () => {
    const { next } = run(mockRequest({ path: '/admin/users' }));
    expect(next).toHaveBeenCalledOnce();
    expect(findOne).not.toHaveBeenCalled();
  });

  it('skips auth routes too', async () => {
    const { next } = run(mockRequest({ path: '/auth/login' }));
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through when maintenance is off', async () => {
    findOne.mockReturnValue(chain({ maintenanceMode: false }));
    const { next, promise } = run(mockRequest({ path: '/api/courses' }));
    await promise;
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through when no settings exist', async () => {
    findOne.mockReturnValue(chain(null));
    const { next, promise } = run(mockRequest({ path: '/api/courses' }));
    await promise;
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks non-admin users during maintenance', async () => {
    findOne.mockReturnValue(chain({ maintenanceMode: true }));
    const req = mockRequest({
      path: '/api/courses',
      currentUser: { userId: 'u1', role: 'student' } as never,
    });
    const { res, next, promise } = run(req);
    await promise;
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Platform is under maintenance. Please try again later.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows admin users during maintenance', async () => {
    findOne.mockReturnValue(chain({ maintenanceMode: true }));
    const req = mockRequest({
      path: '/api/courses',
      currentUser: { userId: 'a1', role: 'admin' } as never,
    });
    const { next, promise } = run(req);
    await promise;
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes through when the settings lookup fails', async () => {
    findOne.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('db down')) });
    const { next, promise } = run(mockRequest({ path: '/api/courses' }));
    await promise;
    expect(next).toHaveBeenCalledOnce();
  });
});
