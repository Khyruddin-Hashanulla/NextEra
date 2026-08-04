import {
  updateAffiliateProfileSchema,
  generateLinkSchema,
  trackClickSchema,
  updateAffiliateSettingsSchema,
  referralCodeParamSchema,
} from '../../../src/validators/affiliate.validator';

describe('affiliate.validator', () => {
  it('validates affiliate profile updates', () => {
    const valid = {
      body: {
        payoutMethod: 'bank',
        payoutDetails: {
          bankAccount: '1234',
          bankIfsc: 'IFSC',
          paypalEmail: 'a@b.com',
          upiId: 'upi',
        },
      },
    };
    expect(updateAffiliateProfileSchema.parse(valid).body.payoutMethod).toBe('bank');
    expect(updateAffiliateProfileSchema.parse({ body: {} }).body).toEqual({});
    expect(
      updateAffiliateProfileSchema.parse({ body: { payoutDetails: { paypalEmail: '' } } }).body.payoutDetails,
    ).toEqual({ paypalEmail: '' });
  });

  it('validates generate link and click tracking', () => {
    expect(generateLinkSchema.parse({ body: { productPath: 'p' } }).body.productPath).toBe('p');
    expect(generateLinkSchema.parse({ body: {} }).body).toEqual({});
    expect(trackClickSchema.parse({ body: { code: 'abc', landingPage: 'l', referrer: 'r' } }).body.code).toBe('abc');
    expect(() => trackClickSchema.parse({ body: { code: '' } })).toThrow();
  });

  it('validates affiliate settings', () => {
    const valid = {
      body: {
        enabled: true,
        commissionType: 'percentage',
        commissionValue: 10,
        eligibleProducts: ['course', 'bundle'],
        minimumPurchaseAmount: 50,
        referralCookieExpiryDays: 30,
        maxCommissionPerOrder: 100,
        autoApproveCommission: true,
      },
    };
    expect(updateAffiliateSettingsSchema.parse(valid).body.commissionType).toBe('percentage');
    expect(() => updateAffiliateSettingsSchema.parse({ body: { referralCookieExpiryDays: 400 } })).toThrow();
  });

  it('validates referral code params', () => {
    expect(referralCodeParamSchema.parse({ params: { code: 'ref123' } }).params.code).toBe('ref123');
    expect(() => referralCodeParamSchema.parse({ params: { code: '' } })).toThrow();
  });
});
