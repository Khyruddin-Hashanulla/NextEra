import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@/lib/validators/authSchema';

describe('loginSchema', () => {
  it('validates valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toContain('valid email');
  });

  it('requires a password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'a@b.com',
    password: 'StrongPass1',
    confirmPassword: 'StrongPass1',
  };

  it('validates a valid payload', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a short name', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'J' }).success).toBe(false);
  });

  it('rejects weak passwords', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'lowercase1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'UPPERCASE1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'NoDigitsHere' }).success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmIssue = result.error.issues.find((i) => i.path[0] === 'confirmPassword');
      expect(confirmIssue?.message).toContain('Passwords do not match');
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('validates an email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'x' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const valid = { password: 'StrongPass1', confirmPassword: 'StrongPass1' };

  it('validates a valid payload', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a short password', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });

  it('rejects mismatched confirmation', () => {
    expect(resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'Nope1' }).success).toBe(false);
  });
});

describe('verifyEmailSchema', () => {
  it('validates a six digit otp', () => {
    expect(verifyEmailSchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
  });

  it('rejects non-digit otps', () => {
    expect(verifyEmailSchema.safeParse({ email: 'a@b.com', otp: '12ab56' }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ email: 'a@b.com', otp: '123' }).success).toBe(false);
  });
});
