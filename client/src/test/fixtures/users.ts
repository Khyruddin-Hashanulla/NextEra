import { buildUser, buildUserWithRole } from '../factories/user.factory';

export const adminUser = buildUserWithRole('admin', {
  _id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
});

export const instructorUser = buildUserWithRole('instructor', {
  _id: 'instructor-1',
  name: 'Instructor User',
  email: 'instructor@example.com',
});

export const studentUser = buildUserWithRole('student', {
  _id: 'student-1',
  name: 'Student User',
  email: 'student@example.com',
});

export const unverifiedUser = buildUser({
  _id: 'unverified-1',
  name: 'Unverified User',
  email: 'unverified@example.com',
  isEmailVerified: false,
});
