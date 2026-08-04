import { buildUser } from '../factories/user.factory';
import { buildCourse } from '../factories/course.factory';
import { ROLES } from '../../constants/roles';

export const courseInstructor = buildUser({
  role: ROLES.INSTRUCTOR,
  name: 'Course Instructor',
  email: 'course.instructor@test.com',
});

export const sampleCourse = buildCourse({
  title: 'Introduction to React',
  slug: 'introduction-to-react',
  price: 1999,
  instructor: courseInstructor._id,
  courseType: 'paid',
});
