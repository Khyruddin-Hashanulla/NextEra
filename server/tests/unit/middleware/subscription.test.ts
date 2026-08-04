import {
  requireProPlan,
  requirePremiumPlan,
  requireSubscription,
  requireFeaturePermission,
} from '../../../src/middlewares/subscription.middleware';
import { subscriptionPermissionService } from '../../../src/services/subscriptionPermission.service';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/services/subscriptionPermission.service', () => ({
  subscriptionPermissionService: {
    getInstructorPlanInfo: vi.fn(),
    isActive: vi.fn(),
  },
}));

const activePlan = {
  status: 'active',
  features: { unlimitedCourses: true, featuredInstructor: true },
} as never;

describe('subscription middleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function run(middleware: ReturnType<typeof requireProPlan>) {
    const req = mockRequest({ currentUser: { userId: 'u1' } as never });
    const res = mockResponse();
    const next = mockNext();
    const promise = middleware(req, res as never, next);
    return { req, res, next, promise };
  }

  it('requireProPlan allows an active pro user', async () => {
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue(activePlan);
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(true);
    const { req, next, promise } = run(requireProPlan);
    await promise;
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.instructorPlan).toBe(activePlan);
  });

  it('requireProPlan rejects a user without unlimited courses', async () => {
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue({
      status: 'active',
      features: { unlimitedCourses: false, featuredInstructor: true },
    } as never);
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(true);
    const { next, promise } = run(requireProPlan);
    await promise;
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('SUBSCRIPTION_REQUIRED');
    expect(err.requiredPlan).toBe('Pro');
  });

  it('requireProPlan rejects an inactive user', async () => {
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(false);
    const { next, promise } = run(requireProPlan);
    await promise;
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('requirePremiumPlan allows a featured instructor', async () => {
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue(activePlan);
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(true);
    const { next, promise } = run(requirePremiumPlan);
    await promise;
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('requirePremiumPlan rejects a non-featured user', async () => {
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue({
      status: 'active',
      features: { unlimitedCourses: true, featuredInstructor: false },
    } as never);
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(true);
    const { next, promise } = run(requirePremiumPlan);
    await promise;
    expect(next.mock.calls[0][0].requiredPlan).toBe('Premium');
  });

  it('requireSubscription allows an active subscriber', async () => {
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue(activePlan);
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(true);
    const { next, promise } = run(requireSubscription);
    await promise;
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('requireSubscription rejects an inactive subscriber with a custom message', async () => {
    vi.mocked(subscriptionPermissionService.isActive).mockReturnValue(false);
    const { next, promise } = run(requireSubscription);
    await promise;
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.message).toContain('You need an active subscription plan');
  });

  it('requireFeaturePermission allows when the check passes', async () => {
    const mw = requireFeaturePermission((info: any) => info.features.unlimitedCourses, 'Bundles', 'Pro');
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue(activePlan);
    const { req, next, promise } = run(mw);
    await promise;
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.instructorPlan).toBe(activePlan);
  });

  it('requireFeaturePermission rejects with an upgrade message', async () => {
    const mw = requireFeaturePermission(() => false, 'Bundles', 'Pro');
    vi.mocked(subscriptionPermissionService.getInstructorPlanInfo).mockResolvedValue(activePlan);
    const { next, promise } = run(mw);
    await promise;
    const err = next.mock.calls[0][0];
    expect(err.requiredPlan).toBe('Pro');
    expect(err.message).toContain('Bundles is available on the Pro plan');
  });
});
