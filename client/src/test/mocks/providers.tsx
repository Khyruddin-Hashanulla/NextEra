import { type ReactNode } from 'react';
import { vi } from 'vitest';
import type { User } from '@/types/user';
import { AuthContext } from '@/providers/AuthProvider';
import { ThemeContext } from '@/providers/ThemeProvider';
import { ToastContext, type Toast } from '@/providers/ToastProvider';
import { buildUserWithRole } from '@/test/factories';

export interface AuthMockValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<User>;
  verifyEmail: (email: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export interface ThemeMockValue {
  mode: 'light' | 'dark' | 'system';
  theme: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

export interface ToastMockValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export function createAuthValue(overrides: Partial<AuthMockValue> = {}): AuthMockValue {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(async () => buildUserWithRole('student')),
    register: vi.fn(async () => {}),
    googleLogin: vi.fn(async () => buildUserWithRole('student')),
    verifyEmail: vi.fn(async () => null as unknown as User),
    logout: vi.fn(async () => {}),
    setUser: vi.fn(),
    ...overrides,
  };
}

export function createThemeValue(overrides: Partial<ThemeMockValue> = {}): ThemeMockValue {
  return {
    mode: 'light',
    theme: 'light',
    setMode: vi.fn(),
    toggleTheme: vi.fn(),
    ...overrides,
  };
}

export function createToastValue(overrides: Partial<ToastMockValue> = {}): ToastMockValue {
  return {
    toasts: [],
    addToast: vi.fn(),
    removeToast: vi.fn(),
    ...overrides,
  };
}

export function MockAuthProvider({ value, children }: { value: AuthMockValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function MockThemeProvider({ value, children }: { value: ThemeMockValue; children: ReactNode }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function MockToastProvider({ value, children }: { value: ToastMockValue; children: ReactNode }) {
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
