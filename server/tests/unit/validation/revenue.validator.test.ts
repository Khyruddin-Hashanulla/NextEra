import {
  createInstructorSubscriptionPlanSchema,
  updateInstructorSubscriptionPlanSchema,
  createAffiliateSchema,
  updateAffiliateSchema,
  createFeaturedPromotionSchema,
  updateFeaturedPromotionSchema,
  purchaseInstructorSubscriptionSchema,
} from '../../../src/validators/revenue.validator';

describe('revenue.validator', () => {
  it('validates instructor subscription plan creation', () => {
    const valid = {
      body: {
        name: 'Pro Plan',
        type: 'paid',
        price: 100,
        durationDays: 30,
        description: 'd',
        features: { freeCoursesLimit: 5, unlimitedCourses: true, storageLimitMB: 1000 },
        status: 'active',
        sortOrder: 1,
      },
    };
    expect(createInstructorSubscriptionPlanSchema.parse(valid).body.type).toBe('paid');
    expect(() => createInstructorSubscriptionPlanSchema.parse({ body: { name: '', type: 'bogus' } })).toThrow();
  });

  it('applies subscription plan defaults', () => {
    const parsed = createInstructorSubscriptionPlanSchema.parse({
      body: { name: 'Free', type: 'free', features: {} },
    });
    expect(parsed.body.price).toBe(0);
    expect(parsed.body.durationDays).toBe(30);
    expect(parsed.body.status).toBe('active');
    expect(parsed.body.sortOrder).toBe(0);
    expect(parsed.body.features.freeCoursesLimit).toBe(2);
  });

  it('validates subscription plan updates', () => {
    expect(
      updateInstructorSubscriptionPlanSchema.parse({ body: { price: 150, status: 'inactive' } }).body.price,
    ).toBe(150);
    expect(() => updateInstructorSubscriptionPlanSchema.parse({ body: { durationDays: 0 } })).toThrow();
  });

  it('validates affiliate creation and transforms code to uppercase', () => {
    const valid = {
      body: {
        user: 'u1',
        code: 'myref',
        commissionPercent: 15,
        payoutMethod: 'paypal',
        payoutDetails: { bankAccount: 'b', bankIfsc: 'i', paypalEmail: 'a@b.com', upiId: 'u' },
      },
    };
    const parsed = createAffiliateSchema.parse(valid);
    expect(parsed.body.code).toBe('MYREF');
    expect(parsed.body.commissionPercent).toBe(15);
    expect(() => createAffiliateSchema.parse({ body: { user: '', code: 'x' } })).toThrow();
  });

  it('validates affiliate updates', () => {
    expect(updateAffiliateSchema.parse({ body: { commissionPercent: 20, status: 'inactive' } }).body.status).toBe(
      'inactive',
    );
    expect(updateAffiliateSchema.parse({ body: { payoutDetails: { paypalEmail: '' } } }).body.payoutDetails).toEqual({
      paypalEmail: '',
    });
    expect(() => updateAffiliateSchema.parse({ body: { commissionPercent: 0 } })).toThrow();
  });

  it('validates featured promotions', () => {
    const valid = {
      body: {
        type: 'course',
        course: 'c1',
        startDate: '2026-01-01',
        endDate: '2026-01-10',
        price: 50,
        position: 1,
        notes: 'n',
      },
    };
    expect(createFeaturedPromotionSchema.parse(valid).body.type).toBe('course');
    expect(() => createFeaturedPromotionSchema.parse({ body: { type: 'course', startDate: '', endDate: '', price: -1 } })).toThrow();
    expect(
      updateFeaturedPromotionSchema.parse({ body: { status: 'active', price: 60, position: 2 } }).body.price,
    ).toBe(60);
  });

  it('validates subscription purchases', () => {
    expect(purchaseInstructorSubscriptionSchema.parse({ body: { planId: 'p1' } }).body.planId).toBe('p1');
    expect(() => purchaseInstructorSubscriptionSchema.parse({ body: { planId: '' } })).toThrow();
  });
});
