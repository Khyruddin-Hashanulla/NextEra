export interface InstructorProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: { url: string; publicId: string };
  bio: string;
  socialLinks: {
    youtube: string;
    twitter: string;
    linkedin: string;
    github: string;
    portfolio: string;
    website: string;
  };
  instructorProfile: {
    qualification: string;
    experience: string;
    expertise: string[];
    teachingCategories: string[];
    resume?: { url: string; publicId: string };
    demoVideo?: { url: string; publicId: string };
    completedCourses: number;
    totalStudents: number;
    rating: number;
  };
  specialties: string[];
  totalCourses: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
  createdAt: string;
}

export type AvatarSource = string | { url: string; publicId: string };

export function avatarUrl(avatar?: AvatarSource): string {
  if (!avatar) return '';
  return typeof avatar === 'string' ? avatar : avatar.url;
}

/**
 * Flexible structural type consumed by the redesigned InstructorCard.
 * The public instructors list returns a subset; profiles return more.
 * Every field is optional so the card renders gracefully with whatever data
 * the consuming endpoint actually provides.
 */
export interface InstructorCardData {
  _id: string;
  name: string;
  email?: string;
  avatar?: AvatarSource;
  bio?: string;
  title?: string;
  specialties?: string[];
  rating?: number;
  totalReviews?: number;
  studentsCount?: number;
  coursesCount?: number;
  experience?: string;
  country?: string;
  socialLinks?: Partial<InstructorProfile['socialLinks']>;
  verified?: boolean;
}

/** Minimal course shape used by the "Recent Courses" rail (structural subset
 *  of both the API course documents and the mock fixtures). */
export interface InstructorCourse {
  _id: string;
  title: string;
  slug?: string;
  thumbnail?: { url: string; publicId?: string };
  category?: string | { _id?: string; name?: string };
  level?: string;
  language?: string;
  price?: number;
  pricing?: { originalPrice?: number; discountPercent?: number };
  totalDuration?: number;
  totalLectures?: number;
  totalEnrollments?: number;
  averageRating?: number;
  totalReviews?: number;
  status?: string;
  featured?: boolean;
}
