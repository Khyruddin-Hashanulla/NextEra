import mongoose from 'mongoose';
import { Course } from '../../models/course.model';
import type { ICourse } from '../../models/course.model';

export interface BuildCourseOptions {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  category?: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  level?: ICourse['level'];
  language?: string;
  visibility?: ICourse['visibility'];
  courseType?: ICourse['courseType'];
  status?: ICourse['status'];
  isApproved?: boolean;
  isActive?: boolean;
  featured?: boolean;
  tags?: string[];
  requirements?: string[];
  whatYouWillLearn?: string[];
}

export function buildCourse(options: BuildCourseOptions) {
  return {
    title: 'Test Course',
    slug: 'test-course',
    description: '',
    shortDescription: '',
    thumbnail: { url: '', publicId: '' },
    introVideo: { source: 'none', url: '', videoId: '', posterUrl: '' },
    welcomeMessage: '',
    congratulationMessage: '',
    pricing: {
      originalPrice: 0,
      discountPercent: 0,
      hasDiscount: false,
      gstPercent: 0,
      gstInclusive: true,
    },
    price: 0,
    level: 'beginner',
    language: 'English',
    prerequisites: '',
    benefits: '',
    requirements: [],
    tags: [],
    whatYouWillLearn: [],
    visibility: 'public',
    courseType: 'free',
    status: 'published',
    isApproved: true,
    isActive: true,
    ...options,
  };
}

export async function createCourse(options: BuildCourseOptions) {
  return Course.create(buildCourse(options));
}
