import { Router } from 'express';
import {
  getAffiliateDashboard,
  getAffiliateProfile,
  updateAffiliateProfile,
  getReferrals,
  getTransactions,
  getPayouts,
  generateLink,
  requestPayout,
  trackClick,
  getReferralInfo,
  getAdminAnalytics,
  getAffiliateSettings,
  updateAffiliateSettings,
  getAdminReferrals,
  getAdminTransactions,
  getAdminPayouts,
  exportCsv,
} from '../controllers/affiliate.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  updateAffiliateProfileSchema,
  generateLinkSchema,
  trackClickSchema,
  updateAffiliateSettingsSchema,
} from '../validators/affiliate.validator';

const router = Router();

// ─── Public ─────────────────────────────────────────────────────
router.get('/info/:code', getReferralInfo);
router.post('/track-click', validate(trackClickSchema), trackClick);

// ─── Authenticated (Self-Service) ──────────────────────────────
router.get('/dashboard', authenticate, getAffiliateDashboard);
router.get('/profile', authenticate, getAffiliateProfile);
router.put('/profile', authenticate, validate(updateAffiliateProfileSchema), updateAffiliateProfile);
router.get('/referrals', authenticate, getReferrals);
router.get('/transactions', authenticate, getTransactions);
router.get('/payouts', authenticate, getPayouts);
router.post('/generate-link', authenticate, validate(generateLinkSchema), generateLink);
router.post('/request-payout', authenticate, requestPayout);

// ─── Admin ──────────────────────────────────────────────────────
router.get('/admin/analytics', authenticate, authorize(ROLES.ADMIN), getAdminAnalytics);
router.get('/admin/settings', authenticate, authorize(ROLES.ADMIN), getAffiliateSettings);
router.put(
  '/admin/settings',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(updateAffiliateSettingsSchema),
  updateAffiliateSettings
);
router.get('/admin/referrals', authenticate, authorize(ROLES.ADMIN), getAdminReferrals);
router.get('/admin/transactions', authenticate, authorize(ROLES.ADMIN), getAdminTransactions);
router.get('/admin/payouts', authenticate, authorize(ROLES.ADMIN), getAdminPayouts);
router.get('/admin/export', authenticate, authorize(ROLES.ADMIN), exportCsv);

export default router;
