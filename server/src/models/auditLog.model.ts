import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
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
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  requestId?: string;
  timestamp: Date;
  deletedAt?: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, required: true, maxlength: 200 },
    adminEmail: { type: String, required: true, maxlength: 254 },
    action: { type: String, required: true, maxlength: 100 },
    resourceType: { type: String, required: true, maxlength: 100 },
    resourceId: { type: String, maxlength: 100 },
    resourceName: { type: String, maxlength: 200 },
    previousData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    changedFields: [{ type: String, maxlength: 200 }],
    requestMethod: { type: String, maxlength: 10 },
    requestUrl: { type: String, maxlength: 500 },
    route: { type: String, maxlength: 200 },
    statusCode: { type: Number },
    success: { type: Boolean, default: true },
    errorMessage: { type: String, maxlength: 5000 },
    ipAddress: { type: String, maxlength: 45 },
    userAgent: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
    deviceType: { type: String, maxlength: 50 },
    browser: { type: String, maxlength: 100 },
    operatingSystem: { type: String, maxlength: 100 },
    requestId: { type: String, maxlength: 100 },
    timestamp: { type: Date, default: Date.now },
    deletedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1 });
auditLogSchema.index({ success: 1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
