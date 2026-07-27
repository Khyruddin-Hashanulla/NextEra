import { Router, Request, Response } from 'express';
import {
  getRevenueDashboard, getRevenueSummary,
  listInstructorSubscriptionPlans, createInstructorSubscriptionPlan,
  updateInstructorSubscriptionPlan, deleteInstructorSubscriptionPlan,
  getInstructorSubscriptionStats,
  listAffiliates, createAffiliate, updateAffiliate, deleteAffiliate,
  getAffiliateStats,
  listFeaturedPromotions, createFeaturedPromotion, updateFeaturedPromotion,
  deleteFeaturedPromotion, getFeaturedPromotionStats,
  trackAffiliateClick, getAffiliateInfo,
} from '../controllers/revenue.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  createInstructorSubscriptionPlanSchema, updateInstructorSubscriptionPlanSchema,
  createAffiliateSchema, updateAffiliateSchema,
  createFeaturedPromotionSchema, updateFeaturedPromotionSchema,
} from '../validators/revenue.validator';

const router = Router();

// All revenue routes require auth + admin
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// Revenue Dashboard
router.get('/dashboard', getRevenueDashboard);
router.get('/summary', getRevenueSummary);

// Instructor Subscription Plans (Admin)
router.get('/instructor-plans', listInstructorSubscriptionPlans);
router.post('/instructor-plans', validate(createInstructorSubscriptionPlanSchema), createInstructorSubscriptionPlan);
router.put('/instructor-plans/:id', validate(updateInstructorSubscriptionPlanSchema), updateInstructorSubscriptionPlan);
router.delete('/instructor-plans/:id', deleteInstructorSubscriptionPlan);
router.get('/instructor-plans/stats', getInstructorSubscriptionStats);

// Affiliates
router.get('/affiliates', listAffiliates);
router.post('/affiliates', validate(createAffiliateSchema), createAffiliate);
router.put('/affiliates/:id', validate(updateAffiliateSchema), updateAffiliate);
router.delete('/affiliates/:id', deleteAffiliate);
router.get('/affiliates/stats', getAffiliateStats);

// Featured Promotions
router.get('/promotions', listFeaturedPromotions);
router.post('/promotions', validate(createFeaturedPromotionSchema), createFeaturedPromotion);
router.put('/promotions/:id', validate(updateFeaturedPromotionSchema), updateFeaturedPromotion);
router.delete('/promotions/:id', deleteFeaturedPromotion);
router.get('/promotions/stats', getFeaturedPromotionStats);

export default router;
