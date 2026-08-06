import { http } from 'msw';
import { failure, success } from '../helpers';
import { sampleCourse, freeCourse, instructorUser } from '@/test/fixtures';

const courses = [sampleCourse, freeCourse];

export const courseHandlers = [
  http.get('/api/v1/student/instructors', () => {
    return success([
      {
        _id: instructorUser._id,
        name: instructorUser.name,
        email: instructorUser.email,
        avatar: instructorUser.avatar?.url ?? '',
        bio: instructorUser.bio ?? '',
        title: '',
        experience: '5 years',
        specialties: [],
        rating: 0,
        coursesCount: 0,
        studentsCount: 0,
        totalReviews: 0,
      },
    ]);
  }),

  http.get('/api/v1/student/instructors/:id', ({ params }) => {
    if (params.id !== instructorUser._id) return failure('Instructor not found', 404);
    return success({
      _id: instructorUser._id,
      name: instructorUser.name,
      email: instructorUser.email,
      phone: '+1 555 0100',
      address: 'San Francisco, CA',
      avatar: instructorUser.avatar,
      bio: instructorUser.bio ?? '',
      socialLinks: instructorUser.socialLinks,
      instructorProfile: {
        qualification: 'MSc Computer Science',
        experience: '5 years',
        expertise: ['React', 'TypeScript'],
        teachingCategories: ['Development'],
        resume: { url: 'https://example.com/resume.pdf', publicId: 'resume-01' },
        demoVideo: { url: 'https://example.com/intro.mp4', publicId: 'demo-01' },
        completedCourses: 2,
        totalStudents: 1200,
        rating: 4.8,
      },
      specialties: ['React', 'TypeScript'],
      totalCourses: 2,
      totalStudents: 1200,
      totalReviews: 98,
      averageRating: 4.8,
      createdAt: '2025-01-15T08:00:00Z',
    });
  }),

  http.get('/api/v1/student/courses', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const level = url.searchParams.get('level');
    const category = url.searchParams.get('category');

    let filtered = courses;
    if (search) filtered = filtered.filter((c) => c.title.toLowerCase().includes(search));
    if (level) filtered = filtered.filter((c) => c.level === level);
    if (category) {
      filtered = filtered.filter((c) => {
        const catName = typeof c.category === 'string' ? c.category : c.category?.name;
        return catName === category;
      });
    }

    return success({
      courses: filtered,
      pagination: { page: 1, pages: 1, total: filtered.length, limit: 12 },
    });
  }),

  http.get('/api/v1/student/courses/:id', ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    const course = courses.find((c) => c._id === params.id);
    if (!course) return failure('Course not found', 404);
    return success({
      course,
      curriculum: [],
      isEnrolled: Boolean(auth),
      enrollment: null,
    });
  }),

  http.get('/api/v1/student/my-courses', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success([{ ...sampleCourse, progress: 42 }]);
  }),
];
