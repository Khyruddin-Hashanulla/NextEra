import mongoose, { Schema, Document } from 'mongoose';

export interface IBundle extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string; publicId: string };
  courses: mongoose.Types.ObjectId[];
  price: number;
  discountedPrice: number;
  totalDuration: number;
  totalLectures: number;
  level: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  totalEnrollments: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bundleSchema = new Schema<IBundle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, maxlength: 300, default: '' },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, default: 0, min: 0 },
    totalDuration: { type: Number, default: 0 },
    totalLectures: { type: Number, default: 0 },
    level: { type: String, default: 'all' },
    tags: [String],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    totalEnrollments: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

bundleSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

bundleSchema.index({ status: 1 });
bundleSchema.index({ slug: 1 }, { unique: true });

export const Bundle = mongoose.model<IBundle>('Bundle', bundleSchema);
