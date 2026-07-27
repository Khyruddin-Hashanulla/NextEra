import { Request, Response } from 'express';
import { revenueService } from '../services/revenue.service';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

// ─── Revenue Dashboard (Admin) ─────────────────────────────────
export const getRevenueDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await revenueService.getRevenueDashboard();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Revenue dashboard fetched', data));
});

export const getRevenueSummary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await revenueService.getRevenueSummary();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Revenue summary fetched', data));
});

// ─── Instructor Subscription Plans (Admin CRUD) ────────────────
export const listInstructorSubscriptionPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await revenueService.listInstructorSubscriptionPlans();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Plans fetched', plans));
});

export const createInstructorSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await revenueService.createInstructorSubscriptionPlan(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Plan created', plan));
});

export const updateInstructorSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const plan = await revenueService.updateInstructorSubscriptionPlan(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Plan updated', plan));
});

export const deleteInstructorSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  await revenueService.deleteInstructorSubscriptionPlan(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Plan deleted', null));
});

// ─── Instructor Subscription Stats ─────────────────────────────
export const getInstructorSubscriptionStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await revenueService.getInstructorSubscriptionStats();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription stats fetched', stats));
});

// ─── Affiliate Management ──────────────────────────────────────
export const listAffiliates = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const data = await revenueService.listAffiliates(page, limit, search);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Affiliates fetched', data));
});

export const createAffiliate = asyncHandler(async (req: Request, res: Response) => {
  const affiliate = await revenueService.createAffiliate(req.body.user, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Affiliate created', affiliate));
});

export const updateAffiliate = asyncHandler(async (req: Request, res: Response) => {
  const affiliate = await revenueService.updateAffiliate(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Affiliate updated', affiliate));
});

export const deleteAffiliate = asyncHandler(async (req: Request, res: Response) => {
  await revenueService.deleteAffiliate(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Affiliate deleted', null));
});

export const getAffiliateStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await revenueService.getAffiliateStats();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Affiliate stats fetched', stats));
});

// ─── Featured Promotions ───────────────────────────────────────
export const listFeaturedPromotions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const data = await revenueService.listFeaturedPromotions(page, limit, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Promotions fetched', data));
});

export const createFeaturedPromotion = asyncHandler(async (req: Request, res: Response) => {
  const promotion = await revenueService.createFeaturedPromotion(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Promotion created', promotion));
});

export const updateFeaturedPromotion = asyncHandler(async (req: Request, res: Response) => {
  const promotion = await revenueService.updateFeaturedPromotion(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Promotion updated', promotion));
});

export const deleteFeaturedPromotion = asyncHandler(async (req: Request, res: Response) => {
  await revenueService.deleteFeaturedPromotion(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Promotion deleted', null));
});

export const getFeaturedPromotionStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await revenueService.getFeaturedPromotionStats();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Promotion stats fetched', stats));
});

// ─── Instructor Self-Service ──────────────────────────────────
export const getInstructorRevenueDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await revenueService.getInstructorRevenueDetail(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Revenue detail fetched', data));
});

export const getMyInstructorSubscription = asyncHandler(async (req: Request, res: Response) => {
  const data = await revenueService.getInstructorSubscription(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription fetched', data));
});

export const purchaseInstructorSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { planId } = req.body;
  const data = await revenueService.subscribeToPlan(req.currentUser!.userId, planId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription processed', data));
});

export const cancelMyInstructorSubscription = asyncHandler(async (req: Request, res: Response) => {
  const data = await revenueService.cancelInstructorSubscription(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription cancelled', data));
});

// ─── Public Affiliate ─────────────────────────────────────────
export const trackAffiliateClick = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  await revenueService.trackAffiliateClick(code);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Click tracked', null));
});

export const getAffiliateInfo = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const data = await revenueService.getAffiliateByCode(code);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Affiliate info fetched', data));
});
