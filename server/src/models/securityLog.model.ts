import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISecurityLog extends Document {
  user?: Types.ObjectId;
  event:
    | 'login'
    | 'login_failed'
    | 'logout'
    | 'password_change'
    | 'email_change'
    | 'role_change'
    | 'account_deactivated'
    | 'account_reactivated'
    | 'two_factor_enabled'
    | 'two_factor_disabled'
    | 'api_key_created'
    | 'api_key_revoked'
    | 'suspicious_activity';
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
}

const securityLogSchema = new Schema<ISecurityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    event: {
      type: String,
      required: true,
      enum: [
        'login',
        'login_failed',
        'logout',
        'password_change',
        'email_change',
        'role_change',
        'account_deactivated',
        'account_reactivated',
        'two_factor_enabled',
        'two_factor_disabled',
        'api_key_created',
        'api_key_revoked',
        'suspicious_activity',
      ],
    },
    ip: { type: String, maxlength: 45 },
    userAgent: { type: String, maxlength: 500 },
    details: { type: Schema.Types.Mixed },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ event: 1 });
securityLogSchema.index({ severity: 1 });

export const SecurityLog = mongoose.model<ISecurityLog>('SecurityLog', securityLogSchema);
