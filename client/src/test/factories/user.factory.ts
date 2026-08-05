import type { User } from '@/types/user';

type Role = User['role'];

export function buildUser(overrides: Partial<User> = {}): User {
  const id = overrides._id ?? 'user-1';
  return {
    _id: id,
    name: 'Test User',
    email: 'test@example.com',
    role: 'student',
    avatar: { url: 'https://example.com/avatar.jpg', publicId: 'avatar' },
    bio: 'A test user',
    socialLinks: {
      youtube: '',
      twitter: '',
      linkedin: '',
      github: '',
      portfolio: '',
      website: '',
    },
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildUserWithRole(role: Role, overrides: Partial<User> = {}): User {
  return buildUser({ role, ...overrides });
}
