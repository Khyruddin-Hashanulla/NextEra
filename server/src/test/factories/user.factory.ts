import mongoose from 'mongoose';
import { User } from '../../models/user.model';
import { ROLES, type Role } from '../../constants/roles';
import type { IUser } from '../../interfaces/IUser';

export interface BuildUserOptions {
  role?: Role;
  password?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  tokenVersion?: number;
  avatar?: { url: string; publicId: string };
  socialLinks?: Partial<IUser['socialLinks']>;
  instructorProfile?: IUser['instructorProfile'];
  name?: string;
  email?: string;
}

export function buildUser(options: BuildUserOptions = {}) {
  const { role = ROLES.STUDENT, password = 'Test@1234', ...rest } = options;
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test.user@example.com',
    role,
    password,
    avatar: { url: 'https://example.com/avatar.png', publicId: 'avatar-test-1' },
    bio: '',
    socialLinks: { youtube: '', twitter: '', linkedin: '', github: '' },
    isEmailVerified: true,
    isActive: true,
    isDeleted: false,
    failedLoginAttempts: 0,
    lockLevel: 0,
    tokenVersion: 0,
    ...rest,
  };
}

export async function createUser(options: BuildUserOptions = {}) {
  return User.create(buildUser(options));
}

export async function createAdmin(options: Omit<BuildUserOptions, 'role'> = {}) {
  return createUser({ ...options, role: ROLES.ADMIN });
}

export async function createInstructor(options: Omit<BuildUserOptions, 'role'> = {}) {
  return createUser({ ...options, role: ROLES.INSTRUCTOR });
}

export async function createStudent(options: Omit<BuildUserOptions, 'role'> = {}) {
  return createUser({ ...options, role: ROLES.STUDENT });
}
