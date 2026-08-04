import type { Course } from '@/types/instructor';

export function buildCourse(overrides: Partial<Course> = {}): Course {
  const id = overrides._id ?? 'course-1';
  return {
    _id: id,
    title: 'Test Course',
    slug: 'test-course',
    description: 'A test course',
    shortDescription: 'Short test course',
    thumbnail: { url: 'https://example.com/thumb.jpg', publicId: 'thumb' },
    introVideo: { source: 'none', url: '', videoId: '', posterUrl: '' },
    welcomeMessage: 'Welcome',
    congratulationMessage: 'Congrats',
    pricing: {
      originalPrice: 999,
      discountPercent: 0,
      hasDiscount: false,
      gstPercent: 18,
      gstInclusive: true,
    },
    price: 999,
    category: { _id: 'cat-1', name: 'Programming' },
    instructor: {
      _id: 'instructor-1',
      name: 'Instructor One',
      email: 'instructor@example.com',
      avatar: { url: 'https://example.com/instructor.jpg' },
    },
    level: 'beginner',
    language: 'English',
    prerequisites: '',
    benefits: '',
    requirements: [],
    tags: [],
    whatYouWillLearn: [],
    visibility: 'public',
    courseType: 'paid',
    status: 'published',
    isApproved: true,
    isActive: true,
    rejectionReason: '',
    featured: false,
    badge: '',
    totalDuration: 100,
    totalLectures: 5,
    ...overrides,
  } as Course;
}
