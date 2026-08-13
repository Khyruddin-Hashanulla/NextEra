import { PlatformSettingsService } from '../../../src/services/platformSettings.service';
import { PlatformSettings } from '../../../src/models/platformSettings.model';

vi.mock('../../../src/models/platformSettings.model', () => ({
  PlatformSettings: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

const service = new PlatformSettingsService();

describe('PlatformSettingsService - pure calculations', () => {
  it('calculateCommission splits amount by commission percent', () => {
    const result = service.calculateCommission(1000, 20);
    expect(result).toEqual({ commissionPercent: 20, commissionAmount: 200, instructorShare: 800 });
  });

  it('calculateCommission rounds the commission amount', () => {
    const result = service.calculateCommission(333, 10);
    expect(result.commissionAmount).toBe(33);
    expect(result.instructorShare).toBe(300);
  });

  it('calculateCommission handles zero commission', () => {
    expect(service.calculateCommission(500, 0).commissionAmount).toBe(0);
    expect(service.calculateCommission(500, 0).instructorShare).toBe(500);
  });

  it('calculateInstructorShare matches the commission split', () => {
    expect(service.calculateInstructorShare(1000, 20)).toBe(800);
    expect(service.calculateInstructorShare(333, 10)).toBe(300);
  });

  it('calculateGST computes tax rounded to the nearest rupee', async () => {
    vi.spyOn(service, 'getGstPercentage').mockResolvedValue(18);
    await expect(service.calculateGST(1000)).resolves.toBe(180);
    await expect(service.calculateGST(333)).resolves.toBe(60);
  });
});

describe('PlatformSettingsService - persistence-backed getters', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getPlatformSettings returns existing settings', async () => {
    vi.mocked(PlatformSettings.findOne as never).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ commissionPercentage: 20 }),
    } as never);
    await expect(service.getPlatformSettings()).resolves.toEqual({ commissionPercentage: 20 });
    expect(PlatformSettings.create).not.toHaveBeenCalled();
  });

  it('getPlatformSettings creates defaults when none exist', async () => {
    vi.mocked(PlatformSettings.findOne as never).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as never);
    const created = { toObject: vi.fn().mockReturnValue({ commissionPercentage: 20, gstPercentage: 18 }) };
    vi.mocked(PlatformSettings.create as never).mockResolvedValue(created);
    await expect(service.getPlatformSettings()).resolves.toEqual({ commissionPercentage: 20, gstPercentage: 18 });
    expect(PlatformSettings.create).toHaveBeenCalledWith({});
  });

  it('getCommissionPercentage returns the stored percentage', async () => {
    vi.spyOn(service, 'getPlatformSettings').mockResolvedValue({ commissionPercentage: 25 } as never);
    await expect(service.getCommissionPercentage()).resolves.toBe(25);
  });

  it('getGstPercentage returns the stored percentage', async () => {
    vi.spyOn(service, 'getPlatformSettings').mockResolvedValue({ gstPercentage: 18 } as never);
    await expect(service.getGstPercentage()).resolves.toBe(18);
  });

  it('getMinimumPayoutAmount returns the stored amount', async () => {
    vi.spyOn(service, 'getPlatformSettings').mockResolvedValue({ minimumPayoutAmount: 500 } as never);
    await expect(service.getMinimumPayoutAmount()).resolves.toBe(500);
  });

  it('getRefundWindowDays returns the stored window', async () => {
    vi.spyOn(service, 'getPlatformSettings').mockResolvedValue({ refundWindowDays: 7 } as never);
    await expect(service.getRefundWindowDays()).resolves.toBe(7);
  });

  it('getSupportEmail returns the stored email', async () => {
    vi.spyOn(service, 'getPlatformSettings').mockResolvedValue({ supportEmail: 'hi@nextera.com' } as never);
    await expect(service.getSupportEmail()).resolves.toBe('hi@nextera.com');
  });
});
