import { PlatformSettings } from '../models/platformSettings.model';

export class PlatformSettingsService {
  async getPlatformSettings() {
    const settings = await PlatformSettings.findOne().lean();
    if (!settings) {
      const created = await PlatformSettings.create({});
      return created.toObject();
    }
    return settings;
  }

  async getCommissionPercentage(): Promise<number> {
    const settings = await this.getPlatformSettings();
    return settings.commissionPercentage;
  }

  async getGstPercentage(): Promise<number> {
    const settings = await this.getPlatformSettings();
    return settings.gstPercentage;
  }

  async getMinimumPayoutAmount(): Promise<number> {
    const settings = await this.getPlatformSettings();
    return settings.minimumPayoutAmount;
  }

  async getRefundWindowDays(): Promise<number> {
    const settings = await this.getPlatformSettings();
    return settings.refundWindowDays;
  }

  async getSupportEmail(): Promise<string> {
    const settings = await this.getPlatformSettings();
    return settings.supportEmail;
  }

  calculateCommission(
    amount: number,
    commissionPercent: number
  ): { commissionPercent: number; commissionAmount: number; instructorShare: number } {
    const commissionAmount = Math.round((amount * commissionPercent) / 100);
    const instructorShare = amount - commissionAmount;
    return { commissionPercent, commissionAmount, instructorShare };
  }

  calculateInstructorShare(amount: number, commissionPercent: number): number {
    return amount - Math.round((amount * commissionPercent) / 100);
  }

  async calculateGST(amount: number): Promise<number> {
    const gstPercent = await this.getGstPercentage();
    return Math.round((amount * gstPercent) / 100);
  }
}

export const platformSettingsService = new PlatformSettingsService();
