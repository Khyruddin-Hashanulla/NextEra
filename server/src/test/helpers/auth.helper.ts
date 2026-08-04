import { generateAccessToken } from '../../utils/generateToken';
import { ROLES, type Role } from '../../constants/roles';
import type { TokenPayload } from '../../interfaces/IUser';

export interface TokenOptions {
  userId?: string;
  role?: Role;
  email?: string;
  tokenVersion?: number;
}

export function buildTokenPayload(options: TokenOptions = {}): TokenPayload {
  return {
    userId: options.userId ?? 'user-test-id',
    role: options.role ?? ROLES.STUDENT,
    email: options.email ?? 'test@example.com',
    tokenVersion: options.tokenVersion ?? 0,
  };
}

export function signAccessToken(options: TokenOptions = {}): string {
  return generateAccessToken(buildTokenPayload(options));
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
