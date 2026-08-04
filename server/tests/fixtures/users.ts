import { ROLES, type Role } from '../../src/constants/roles';

export function buildUserDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: '65f1a1b2c3d4e5f6a7b8c9d0',
    name: 'Test User',
    email: 'test.user@example.com',
    role: ROLES.STUDENT as Role,
    avatar: { url: 'https://example.com/avatar.png', publicId: 'avatar-1' },
    bio: '',
    socialLinks: { youtube: '', twitter: '', linkedin: '', github: '' },
    isEmailVerified: true,
    isActive: true,
    isDeleted: false,
    failedLoginAttempts: 0,
    lockLevel: 0,
    tokenVersion: 0,
    comparePassword: async () => false,
    save: vi.fn(),
    ...overrides,
  };
}

export const studentUser = buildUserDoc({ email: 'student@example.com' });
export const instructorUser = buildUserDoc({
  _id: '65f1a1b2c3d4e5f6a7b8c9d1',
  name: 'Instructor User',
  email: 'instructor@example.com',
  role: ROLES.INSTRUCTOR,
});
export const adminUser = buildUserDoc({
  _id: '65f1a1b2c3d4e5f6a7b8c9d2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: ROLES.ADMIN,
});
export const unverifiedUser = buildUserDoc({
  _id: '65f1a1b2c3d4e5f6a7b8c9d3',
  email: 'unverified@example.com',
  isEmailVerified: false,
});
export const lockedUser = buildUserDoc({
  _id: '65f1a1b2c3d4e5f6a7b8c9d4',
  email: 'locked@example.com',
  accountLockedUntil: new Date(Date.now() + 60_000),
  lockLevel: 1,
});
