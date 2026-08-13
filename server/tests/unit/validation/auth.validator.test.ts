import {
  registerSchema,
  loginSchema,
  sendOTPSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  refreshTokenSchema,
} from '../../../src/validators/auth.validator';

describe('registerSchema', () => {
  it('accepts a valid registration and normalizes email', () => {
    const out = registerSchema.parse({
      name: '  Jane Doe  ',
      email: 'JANE@Example.COM',
      password: 'StrongPass1',
    });
    expect(out.name).toBe('Jane Doe');
    expect(out.email).toBe('jane@example.com');
    expect(out.password).toBe('StrongPass1');
  });

  it('does not accept emails with surrounding whitespace', () => {
    expect(() => registerSchema.parse({ name: 'Jane', email: '  a@b.com  ', password: 'StrongPass1' })).toThrow(
      /Invalid email address/
    );
  });

  it('rejects names shorter than 2 characters', () => {
    expect(() => registerSchema.parse({ name: 'A', email: 'a@b.com', password: 'StrongPass1' })).toThrow(
      /at least 2 characters/
    );
  });

  it('rejects an invalid email', () => {
    expect(() => registerSchema.parse({ name: 'Jane', email: 'not-an-email', password: 'StrongPass1' })).toThrow(
      /Invalid email address/
    );
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(() => registerSchema.parse({ name: 'Jane', email: 'a@b.com', password: 'Short1' })).toThrow(
      /at least 8 characters/
    );
  });

  it.each([
    ['uppercase', 'lowercase1', /uppercase letter/],
    ['lowercase', 'UPPERCASE1', /lowercase letter/],
    ['number', 'NoNumbersHere', /number/],
  ] as const)('rejects passwords missing %s', (_label, password, pattern) => {
    expect(() => registerSchema.parse({ name: 'Jane', email: 'a@b.com', password })).toThrow(pattern);
  });
});

describe('loginSchema', () => {
  it('accepts a valid login and lowercases the email', () => {
    const out = loginSchema.parse({ email: 'A@B.COM', password: 'secret' });
    expect(out.email).toBe('a@b.com');
  });

  it('rejects a missing password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow(/Password is required/);
  });
});

describe('sendOTPSchema / forgotPasswordSchema', () => {
  it('lowercases and trims the email', () => {
    expect(sendOTPSchema.parse({ email: 'X@Y.io' }).email).toBe('x@y.io');
    expect(forgotPasswordSchema.parse({ email: 'X@Y.io' }).email).toBe('x@y.io');
  });

  it('rejects invalid emails', () => {
    expect(() => sendOTPSchema.parse({ email: 'nope' })).toThrow();
  });
});

describe('verifyEmailSchema', () => {
  it('accepts a 6-digit otp', () => {
    expect(verifyEmailSchema.parse({ email: 'a@b.com', otp: '123456' }).otp).toBe('123456');
  });

  it('rejects otps that are not exactly 6 characters', () => {
    expect(() => verifyEmailSchema.parse({ email: 'a@b.com', otp: '12345' })).toThrow(/OTP must be 6 digits/);
    expect(() => verifyEmailSchema.parse({ email: 'a@b.com', otp: '1234567' })).toThrow(/OTP must be 6 digits/);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts a valid token and strong password', () => {
    const out = resetPasswordSchema.parse({ token: 'abc', password: 'StrongPass1' });
    expect(out.token).toBe('abc');
    expect(out.password).toBe('StrongPass1');
  });

  it('rejects a missing token', () => {
    expect(() => resetPasswordSchema.parse({ token: '', password: 'StrongPass1' })).toThrow(/Reset token is required/);
  });

  it('enforces password complexity', () => {
    expect(() => resetPasswordSchema.parse({ token: 't', password: 'weak' })).toThrow();
  });
});

describe('googleAuthSchema / refreshTokenSchema', () => {
  it('requires a non-empty credential', () => {
    expect(() => googleAuthSchema.parse({ credential: '' })).toThrow(/Google credential is required/);
    expect(googleAuthSchema.parse({ credential: 'abc' }).credential).toBe('abc');
  });

  it('requires a non-empty refresh token', () => {
    expect(() => refreshTokenSchema.parse({ refreshToken: '' })).toThrow(/Refresh token is required/);
  });
});
