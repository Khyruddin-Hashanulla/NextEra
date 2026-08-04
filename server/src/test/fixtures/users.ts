import { buildUser } from '../factories/user.factory';
import { ROLES } from '../../constants/roles';

export const adminUser = buildUser({
  role: ROLES.ADMIN,
  name: 'Admin User',
  email: 'admin@test.com',
});

export const instructorUser = buildUser({
  role: ROLES.INSTRUCTOR,
  name: 'Instructor User',
  email: 'instructor@test.com',
});

export const studentUser = buildUser({
  role: ROLES.STUDENT,
  name: 'Student User',
  email: 'student@test.com',
});

export const unverifiedUser = buildUser({
  role: ROLES.STUDENT,
  name: 'Unverified User',
  email: 'unverified@test.com',
  isEmailVerified: false,
});
