import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image: { url: string; publicId: string };
  link?: string;
  position: 'hero' | 'sidebar' | 'promo' | 'footer';
  order: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300 },
    image: {
      url: { type: String, required: true, maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    link: { type: String, maxlength: 500 },
    position: {
      type: String,
      enum: ['hero', 'sidebar', 'promo', 'footer'],
      default: 'hero',
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
