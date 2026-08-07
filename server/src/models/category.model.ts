import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    icon: {
      type: String,
      default: '',
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export interface CategorySeedInput {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export const DEFAULT_CATEGORIES: CategorySeedInput[] = [
  { name: 'Development', slug: 'development', description: 'Web, mobile, game, and software development', icon: '💻', isActive: true },
  { name: 'Data Science', slug: 'data-science', description: 'Data analysis, visualization, and engineering', icon: '📊', isActive: true },
  { name: 'Design', slug: 'design', description: 'UI/UX, graphic design, and creative skills', icon: '🎨', isActive: true },
  { name: 'Business', slug: 'business', description: 'Marketing, management, and entrepreneurship', icon: '💼', isActive: true },
  { name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'Machine learning and AI applications', icon: '🤖', isActive: true },
  { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security, cloud, and infrastructure', icon: '🛡️', isActive: true },
  { name: 'Cloud Computing', slug: 'cloud-computing', description: 'AWS, Azure, and cloud infrastructure', icon: '☁️', isActive: true },
  { name: 'Marketing', slug: 'marketing', description: 'Digital marketing, SEO, and growth', icon: '📈', isActive: true },
  { name: 'Finance', slug: 'finance', description: 'Accounting, investing, and personal finance', icon: '💰', isActive: true },
  { name: 'Personal Development', slug: 'personal-development', description: 'Productivity, leadership, and soft skills', icon: '🧠', isActive: true },
];

export const Category = mongoose.model<ICategory>('Category', categorySchema);
