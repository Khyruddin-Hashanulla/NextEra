import mongoose, { Schema, Document } from 'mongoose';

export interface IRolePermission extends Document {
  role: 'admin' | 'instructor' | 'student';
  permissions: {
    module: string;
    actions: ('create' | 'read' | 'update' | 'delete')[];
  }[];
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    role: {
      type: String,
      enum: ['admin', 'instructor', 'student'],
      required: true,
      unique: true,
    },
    permissions: [
      {
        module: { type: String, required: true },
        actions: [{ type: String, enum: ['create', 'read', 'update', 'delete'] }],
      },
    ],
    description: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const RolePermission = mongoose.model<IRolePermission>('RolePermission', rolePermissionSchema);
