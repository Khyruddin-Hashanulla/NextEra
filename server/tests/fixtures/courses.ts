export function buildCourseDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: '65f1a1b2c3d4e5f6a7b8c9d5',
    title: 'Introduction to React',
    slug: 'introduction-to-react',
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
    price: 1999,
    category: '65f1a1b2c3d4e5f6a7b8c9d6',
    instructor: '65f1a1b2c3d4e5f6a7b8c9d1',
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
    publishedAt: new Date(),
    archivedAt: null,
    featured: false,
    badge: '',
    totalDuration: 0,
    totalLectures: 0,
    totalSections: 0,
    totalResources: 0,
    averageRating: 0,
    totalReviews: 0,
    totalEnrollments: 0,
    save: vi.fn(),
    ...overrides,
  };
}

export const publishedCourse = buildCourseDoc();
export const draftCourse = buildCourseDoc({
  status: 'draft',
  isApproved: false,
  courseType: 'free',
  price: 0,
});
export const freeCourse = buildCourseDoc({ price: 0, courseType: 'free' });
export const reviewCourse = buildCourseDoc({ status: 'review', isApproved: false });
export const archivedCourse = buildCourseDoc({ status: 'archived', isActive: false, visibility: 'private' });
