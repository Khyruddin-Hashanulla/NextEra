import mongoose from 'mongoose';
import { AuditLog } from '../models/auditLog.model';
import { escapeRegex } from '../utils/escapeRegex';

const SENSITIVE_FIELDS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'jwt',
  'secret',
  'otp',
  'otpToken',
  'resetToken',
  'creditCard',
  'cvv',
  'cardNumber',
  'cardCvv',
  'cardExpiry',
  'apiKey',
  'apiSecret',
  'privateKey',
  'cookie',
  'sessionId',
]);

const KNOWN_ACTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'ROLE_CHANGED',
  'INSTRUCTOR_APPROVED',
  'INSTRUCTOR_REJECTED',
  'COURSE_APPROVED',
  'COURSE_REJECTED',
  'COURSE_DELETED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DELETED',
  'COUPON_CREATED',
  'COUPON_UPDATED',
  'COUPON_DELETED',
  'REFUND_APPROVED',
  'REFUND_REJECTED',
  'WALLET_CREDIT',
  'WALLET_DEBIT',
  'PAYOUT_APPROVED',
  'PAYOUT_REJECTED',
  'CERTIFICATE_GENERATED',
  'CERTIFICATE_REVOKED',
  'CERTIFICATE_RESTORED',
  'BLOG_CREATED',
  'BLOG_UPDATED',
  'BLOG_DELETED',
  'BANNER_CREATED',
  'BANNER_UPDATED',
  'BANNER_DELETED',
  'CMS_CREATED',
  'CMS_UPDATED',
  'CMS_DELETED',
  'FEATURE_TOGGLE_CHANGED',
  'EMAIL_TEMPLATE_CREATED',
  'EMAIL_TEMPLATE_UPDATED',
  'EMAIL_TEMPLATE_DELETED',
  'SECURITY_SETTING_CHANGED',
  'SUBSCRIPTION_PLAN_CREATED',
  'SUBSCRIPTION_PLAN_UPDATED',
  'SUBSCRIPTION_PLAN_DELETED',
  'INSTRUCTOR_SUBSCRIPTION_CHANGED',
  'INSTRUCTOR_PLAN_ASSIGNED',
  'BACKUP_STARTED',
  'BACKUP_COMPLETED',
  'RESTORE_STARTED',
  'RESTORE_COMPLETED',
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT',
  'PASSWORD_RESET',
  '2FA_ENABLED',
  '2FA_DISABLED',
  'SETTINGS_UPDATED',
  'NOTIFICATION_CREATED',
  'NOTIFICATION_DELETED',
  'REVIEW_MODERATED',
  'SUPPORT_TICKET_UPDATED',
  'REFERRAL_CREATED',
  'REFERRAL_CONVERTED',
  'ASSIGNMENT_SUBMITTED',
  'ASSIGNMENT_UPDATED',
  'ASSIGNMENT_STATUS_CHANGED',
  'ASSIGNMENT_GRADED',
  'ASSIGNMENT_GRADE_UPDATED',
  'ASSIGNMENT_FEEDBACK_EDITED',
  'ASSIGNMENT_RETURNED',
  'ASSIGNMENT_PUBLISHED',
  'ASSIGNMENT_REJECTED',
  'ASSIGNMENT_OVERRIDE',
  'QUIZ_STARTED',
  'QUIZ_SUBMITTED',
  'QUIZ_GRADED',
  'QUIZ_PUBLISHED',
  'QUIZ_OVERRIDE',
  'QUIZ_AUTO_SUBMITTED',
  'QUIZ_RESUMED',
  'QUIZ_FAILED',
  'QUIZ_ENDED',
  'QUIZ_COMPLETED',
  'AFFILIATE_COMMISSION_CREDITED',
  'AFFILIATE_COMMISSION_REVERSED',
  'AFFILIATE_PAYOUT_REQUESTED',
  'AFFILIATE_PAYOUT_APPROVED',
  'AFFILIATE_PAYOUT_REJECTED',
  'AFFILIATE_SETTINGS_UPDATED',
  'FAQ_CREATED',
  'FAQ_UPDATED',
  'FAQ_DELETED',
  'ROLE_PERMISSION_CREATED',
  'ROLE_PERMISSION_UPDATED',
  'BACKUP_DELETED',
  'access_denied',
] as const;

export type AuditAction = (typeof KNOWN_ACTIONS)[number];

export interface AuditLogParams {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changedFields?: string[];
  requestMethod?: string;
  requestUrl?: string;
  route?: string;
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface AuditSearchFilters {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  resourceType?: string;
  success?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function maskSensitiveData(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data) return data;
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key)) {
      masked[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function computeChangedFields(
  previous: Record<string, any> | undefined,
  next: Record<string, any> | undefined
): string[] {
  if (!previous || !next) return [];
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  for (const key of allKeys) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      changed.push(key);
    }
  }
  return changed;
}

function parseUserAgent(ua: string | undefined): { browser: string; os: string; deviceType: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', deviceType: 'Unknown' };
  const lower = ua.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';
  if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('edg')) browser = 'Edge';
  else if (lower.includes('chrome')) browser = 'Chrome';
  else if (lower.includes('safari')) browser = 'Safari';
  else if (lower.includes('opera') || lower.includes('opr')) browser = 'Opera';
  if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('mac')) os = 'macOS';
  else if (lower.includes('linux')) os = 'Linux';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';
  if (lower.includes('mobile')) deviceType = 'Mobile';
  else if (lower.includes('tablet') || lower.includes('ipad')) deviceType = 'Tablet';
  return { browser, os, deviceType };
}

class AuditService {
  async log(params: AuditLogParams): Promise<void> {
    try {
      const maskedPrevious = maskSensitiveData(params.previousData);
      const maskedNew = maskSensitiveData(params.newData);
      const changedFields = params.changedFields || computeChangedFields(maskedPrevious, maskedNew);
      const parsed = parseUserAgent(params.userAgent);
      await AuditLog.create({
        adminId: params.adminId,
        adminName: params.adminName,
        adminEmail: params.adminEmail,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        previousData: maskedPrevious,
        newData: maskedNew,
        changedFields,
        requestMethod: params.requestMethod,
        requestUrl: params.requestUrl,
        route: params.route,
        statusCode: params.statusCode,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceType: parsed.deviceType,
        browser: parsed.browser,
        operatingSystem: parsed.os,
        requestId: params.requestId,
        metadata: params.metadata,
        timestamp: new Date(),
      });
    } catch {
      // fire-and-forget; never fail the request due to audit logging
    }
  }

  async search(filters: AuditSearchFilters) {
    const {
      page = 1,
      limit = 20,
      adminId,
      action,
      resourceType,
      success,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query: Record<string, any> = { deletedAt: null };
    if (adminId) query.adminId = new mongoose.Types.ObjectId(adminId);
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (success !== undefined) query.success = success;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { adminName: { $regex: escaped, $options: 'i' } },
        { adminEmail: { $regex: escaped, $options: 'i' } },
        { resourceType: { $regex: escaped, $options: 'i' } },
        { resourceName: { $regex: escaped, $options: 'i' } },
        { action: { $regex: escaped, $options: 'i' } },
        { resourceId: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort(sort).skip(skip).limit(limit).populate('adminId', 'name email avatar').lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getActions(): Promise<string[]> {
    return KNOWN_ACTIONS.filter((a) => a !== 'access_denied') as string[];
  }

  async getResourceTypes(): Promise<string[]> {
    const result = await AuditLog.distinct('resourceType', { deletedAt: null });
    return result.sort();
  }
}

export const auditService = new AuditService();
