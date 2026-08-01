import { Request, Response } from 'express';
import { affiliateService } from '../services/affiliate.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

// ─── Self-Service ───────────────────────────────────────────────
export const getAffiliateDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await affiliateService.getDashboard(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Dashboard fetched', data));
});

export const getAffiliateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await affiliateService.getAffiliateProfile(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Profile fetched', data));
});

export const updateAffiliateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await affiliateService.updateAffiliateProfile(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Profile updated', data));
});

export const getReferrals = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await affiliateService.getReferrals(req.currentUser!.userId, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Referrals fetched', data));
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await affiliateService.getTransactions(req.currentUser!.userId, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Transactions fetched', data));
});

export const getPayouts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await affiliateService.getPayoutHistory(req.currentUser!.userId, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payouts fetched', data));
});

export const generateLink = asyncHandler(async (req: Request, res: Response) => {
  const affiliate = await affiliateService.getOrCreateAffiliate(req.currentUser!.userId);
  const link = affiliateService.generateReferralLink(affiliate.code, req.body.productPath);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Link generated', {
    code: affiliate.code,
    referralLink: link,
  }));
});

export const requestPayout = asyncHandler(async (req: Request, res: Response) => {
  const data = await affiliateService.requestPayout(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payout requested', data));
});

// ─── Public ─────────────────────────────────────────────────────
export const trackClick = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.headers['user-agent'];
  const { code, landingPage, referrer } = req.body;
  const result = await affiliateService.trackClick(code, ip, userAgent, referrer, landingPage);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Click tracked', result));
});

export const getReferralInfo = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const data = await affiliateService.getReferralInfo(code);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Referral info fetched', data));
});

// ─── Admin ──────────────────────────────────────────────────────
export const getAdminAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await affiliateService.getAdminAnalytics();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Analytics fetched', data));
});

export const getAffiliateSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await affiliateService.getSettings();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Settings fetched', data));
});

export const updateAffiliateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await affiliateService.updateSettings(req.body, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Settings updated', data));
});

export const getAdminReferrals = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await affiliateService.getAdminReferrals(page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Referrals fetched', data));
});

export const getAdminTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await affiliateService.getAdminTransactions(page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Transactions fetched', data));
});

export const getAdminPayouts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const data = await affiliateService.getAdminPayouts(page, limit, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payouts fetched', data));
});

export const exportCsv = asyncHandler(async (_req: Request, res: Response) => {
  const csv = await affiliateService.generateCsvReport();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=affiliate-report-${Date.now()}.csv`);
  res.status(HTTP_STATUS.OK).send(csv);
});
