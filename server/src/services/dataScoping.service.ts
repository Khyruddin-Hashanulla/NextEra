import { Request } from 'express';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles';
import { AuditLog } from '../models/auditLog.model';

export function isAdmin(req: Request): boolean {
  return req.currentUser?.role === ROLES.ADMIN;
}

export function getUserId(req: Request): string {
  return req.currentUser!.userId;
}

export function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
}

export function getUserAgent(req: Request): string {
  return (req.headers['user-agent'] as string) || '';
}

export async function auditDenied(
  req: Request,
  resource: string,
  resourceId: string | undefined,
  reason: string
): Promise<void> {
  if (!req.currentUser) return;
  try {
    await AuditLog.create({
      adminId: req.currentUser.userId,
      adminName: '',
      adminEmail: req.currentUser.email,
      action: 'access_denied',
      resourceType: resource,
      resourceId,
      ipAddress: getIp(req),
      userAgent: getUserAgent(req),
      success: false,
      requestUrl: req.originalUrl,
      requestMethod: req.method,
      route: req.route?.path || req.originalUrl,
      metadata: {
        reason,
        role: req.currentUser.role,
      },
    });
  } catch {
    // fire-and-forget; never fail the request due to audit logging
  }
}

export class DataScopingService {
  async scopedFindById(model: mongoose.Model<any>, id: string, req: Request, ownerField: string): Promise<any> {
    if (isAdmin(req)) return model.findById(id).lean();
    return model.findOne({ _id: id, [ownerField]: getUserId(req) }).lean();
  }

  async scopedFindOne(
    model: mongoose.Model<any>,
    filter: Record<string, any>,
    req: Request,
    ownerField: string
  ): Promise<any> {
    if (isAdmin(req)) return model.findOne(filter).lean();
    return model.findOne({ ...filter, [ownerField]: getUserId(req) }).lean();
  }

  async scopedFind(
    model: mongoose.Model<any>,
    filter: Record<string, any>,
    req: Request,
    ownerField: string
  ): Promise<any[]> {
    if (isAdmin(req)) return model.find(filter).lean();
    return model.find({ ...filter, [ownerField]: getUserId(req) }).lean();
  }

  async scopedFindByIdAndUpdate(
    model: mongoose.Model<any>,
    id: string,
    update: Record<string, any>,
    req: Request,
    ownerField: string,
    options: Record<string, any> = {}
  ): Promise<any> {
    if (isAdmin(req)) return model.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
    return model.findOneAndUpdate({ _id: id, [ownerField]: getUserId(req) }, update, { new: true, ...options }).lean();
  }

  async scopedFindByIdAndDelete(
    model: mongoose.Model<any>,
    id: string,
    req: Request,
    ownerField: string
  ): Promise<any> {
    if (isAdmin(req)) return model.findByIdAndDelete(id).lean();
    return model.findOneAndDelete({ _id: id, [ownerField]: getUserId(req) }).lean();
  }
}

export const dataScopingService = new DataScopingService();
