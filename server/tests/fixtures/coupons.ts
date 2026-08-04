export function buildCouponDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: '65f1a1b2c3d4e5f6a7b8c9d7',
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxUses: 100,
    usedCount: 0,
    minAmount: 0,
    ...overrides,
  };
}

export const percentageCoupon = buildCouponDoc();
export const fixedCoupon = buildCouponDoc({
  code: 'FLAT50',
  discountType: 'fixed',
  discountValue: 500,
});
export const expiredCoupon = buildCouponDoc({
  code: 'EXPIRED',
  expiresAt: new Date(Date.now() - 1000),
});
export const exhaustedCoupon = buildCouponDoc({
  code: 'USEDUP',
  maxUses: 1,
  usedCount: 1,
});
export const minAmountCoupon = buildCouponDoc({
  code: 'MIN1000',
  minAmount: 1000,
});
