import { buildCourse } from '../factories/course.factory';

export const sampleCourse = buildCourse({
  _id: 'course-1',
  title: 'Introduction to React',
  slug: 'introduction-to-react',
  price: 1999,
  totalLectures: 12,
  totalDuration: 480,
});

export const freeCourse = buildCourse({
  _id: 'course-2',
  title: 'Free Sample Course',
  slug: 'free-sample-course',
  price: 0,
  courseType: 'free',
});
