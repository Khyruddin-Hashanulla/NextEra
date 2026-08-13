import { EntitlementService } from '../../../src/services/entitlement.service';

vi.mock('../../../src/models/platformSettings.model', () => ({
  PlatformSettings: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

import { PlatformSettings } from '../../../src/models/platformSettings.model';

const service = new EntitlementService();

beforeEach(() => {
  vi.mocked(PlatformSettings.findOne as never).mockReturnValue({
    lean: async () => ({ commissionPercentage: 20 }),
  } as never);
});

function view(status: string, revenue: any = { enabled: false, commissionPercent: 0, instructorSharePercent: 100 }) {
  return {
    status,
    autoRenew: false,
    entitlements: {
      courses: {
        canCreateFree: true,
        canCreatePaid: false,
        maxCreationCount: 2,
        creationWindowDays: 30,
        maxPublishedCourses: 2,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
      students: { maxStudents: 100 },
      revenue,
      storage: { videoGB: 2, materialGB: 1, recordingGB: 0, maxVideoFileSizeMB: 500 },
      certificates: { enabled: false, qrVerification: false },
      liveClasses: { enabled: false, monthlyLimit: 0, maxDurationMinutes: 0, recording: false },
      analytics: { basic: true, advanced: false, revenue: false, export: false },
      marketing: {
        coupons: false,
        maxActiveCoupons: 0,
        bundles: false,
        instructorSubscriptions: false,
        affiliate: false,
        affiliatePayout: false,
      },
      support: { level: 'none' },
    } as any,
  };
}

describe('EntitlementService.getInstructorCommission', () => {
  it('applies the plan commission split while the subscription is active', async () => {
    const result = await service.getInstructorCommission(
      'i1',
      view('active', {
        enabled: true,
        commissionPercent: 25,
        instructorSharePercent: 75,
      }) as any
    );

    expect(result).toEqual({ commissionPercent: 25, instructorSharePercent: 75 });
  });

  it('applies the platform default commission for an active plan without a revenue split', async () => {
    const result = await service.getInstructorCommission('i1', view('active') as any);

    expect(result).toEqual({ commissionPercent: 20, instructorSharePercent: 80 });
  });

  it('takes no commission after the subscription expires', async () => {
    const result = await service.getInstructorCommission(
      'i1',
      view('expired', {
        enabled: true,
        commissionPercent: 25,
        instructorSharePercent: 75,
      }) as any
    );

    expect(result).toEqual({ commissionPercent: 0, instructorSharePercent: 100 });
  });

  it('takes no commission after the subscription is cancelled', async () => {
    const result = await service.getInstructorCommission(
      'i1',
      view('cancelled', {
        enabled: true,
        commissionPercent: 25,
        instructorSharePercent: 75,
      }) as any
    );

    expect(result).toEqual({ commissionPercent: 0, instructorSharePercent: 100 });
  });

  it('takes no commission when the instructor has no subscription', async () => {
    const result = await service.getInstructorCommission('i1', view('none') as any);

    expect(result).toEqual({ commissionPercent: 0, instructorSharePercent: 100 });
  });
});
