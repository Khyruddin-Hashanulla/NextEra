import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AxiosError } from 'axios';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import { buildUserWithRole } from '@/test/factories';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function renderForm(ui: React.ReactNode, options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(
    <GoogleOAuthProvider clientId="test-client-id">
      {ui}
      <PathProbe />
    </GoogleOAuthProvider>,
    options,
  );
}

function apiError(message: string, status = 400): AxiosError {
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: { message },
    statusText: 'Bad Request',
    headers: {},
    config: {} as never,
  });
}

describe('LoginForm', () => {
  it('renders the heading, fields and links', () => {
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: createAuthValue() });
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation errors for an empty submit', async () => {
    const user = userEvent.setup();
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: createAuthValue() });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('calls login and navigates to the dashboard on success', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({ login: vi.fn(async () => buildUserWithRole('student')) });
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: auth });
    await user.type(screen.getByLabelText('Email'), 'student@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(auth.login).toHaveBeenCalledWith('student@example.com', 'Password1'));
    expect(await screen.findByText('/student')).toBeInTheDocument();
  });

  it('reveals the unverified-email panel when login is rejected as unverified', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(() => Promise.reject(apiError('Please verify your email before logging in.', 403))),
    });
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: auth });
    await user.type(screen.getByLabelText('Email'), 'unverified@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email verification required')).toBeInTheDocument();
    expect(screen.getByText(/Please verify your email address/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend verification/ })).toBeInTheDocument();
  });

  it('resends the verification OTP from the unverified panel', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(() => Promise.reject(apiError('Please verify your email before logging in.', 403))),
    });
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: auth });
    await user.type(screen.getByLabelText('Email'), 'unverified@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Email verification required');

    await user.click(screen.getByRole('button', { name: /Resend verification/ }));
    expect(await screen.findByText('OTP sent successfully')).toBeInTheDocument();
  });

  it('shows the account-locked toast when login is rejected as locked', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({
      login: vi.fn(() =>
        Promise.reject(
          apiError('Your account is temporarily locked due to multiple failed login attempts. Please try again later.', 423),
        ),
      ),
    });
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: auth });
    await user.type(screen.getByLabelText('Email'), 'locked@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.includes('Account locked'))).toBe(true);
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderForm(<LoginForm />, { route: '/auth/login', mockAuth: createAuthValue() });
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('RegisterForm', () => {
  it('renders all fields and validates mismatched passwords', async () => {
    const user = userEvent.setup();
    renderForm(<RegisterForm />, { route: '/auth/register', mockAuth: createAuthValue() });
    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password2');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('submits and navigates to email verification on success', async () => {
    const user = userEvent.setup();
    const auth = createAuthValue({ register: vi.fn(async () => {}) });
    renderForm(<RegisterForm />, { route: '/auth/register', mockAuth: auth });

    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.type(screen.getByLabelText('Confirm Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(auth.register).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'Password1'));
    expect(await screen.findByText('/auth/verify-email')).toBeInTheDocument();
  });

  it('shows a validation error for a weak password', async () => {
    const user = userEvent.setup();
    renderForm(<RegisterForm />, { route: '/auth/register', mockAuth: createAuthValue() });
    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.type(screen.getByLabelText('Confirm Password'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });
});

describe('ForgotPasswordForm', () => {
  it('renders the email field and validation', async () => {
    const user = userEvent.setup();
    renderForm(<ForgotPasswordForm />, { route: '/auth/forgot-password' });
    expect(screen.getByRole('heading', { name: 'Forgot password?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('shows the success state after sending', async () => {
    const user = userEvent.setup();
    renderForm(<ForgotPasswordForm />, { route: '/auth/forgot-password' });
    await user.type(screen.getByLabelText('Email'), 'student@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to login/ })).toBeInTheDocument();
  });
});

describe('ResetPasswordForm', () => {
  it('shows the invalid-link state when no token is present', () => {
    renderForm(<ResetPasswordForm />, { route: '/auth/reset-password' });
    expect(screen.getByRole('heading', { name: 'Invalid reset link' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request new link/ })).toBeInTheDocument();
  });

  it('validates the new password', async () => {
    const user = userEvent.setup();
    renderForm(<ResetPasswordForm />, { route: '/auth/reset-password?token=abc' });
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('resets the password and navigates to login', async () => {
    const user = userEvent.setup();
    renderForm(<ResetPasswordForm />, { route: '/auth/reset-password?token=abc' });
    await user.type(screen.getByLabelText('New Password'), 'NewPass1');
    await user.type(screen.getByLabelText('Confirm New Password'), 'NewPass1');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('/auth/login')).toBeInTheDocument();
  });
});

describe('VerifyEmailForm', () => {
  it('walks through the email -> OTP -> verified flow', async () => {
    const user = userEvent.setup();
    renderForm(<VerifyEmailForm />, { route: '/auth/verify-email' });

    expect(screen.getByRole('heading', { name: 'Verify your email' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'student@example.com');
    await user.click(screen.getByRole('button', { name: 'Send OTP' }));

    const otpInput = await screen.findByLabelText('Verification Code');
    expect(otpInput).toBeInTheDocument();
    await user.type(otpInput, '123456');
    await user.click(screen.getByRole('button', { name: 'Verify email' }));

    expect(await screen.findByText('/student')).toBeInTheDocument();
  });

  it('shows an OTP validation error for a short code', async () => {
    const user = userEvent.setup();
    renderForm(<VerifyEmailForm />, { route: '/auth/verify-email' });

    await user.type(screen.getByLabelText('Email'), 'student@example.com');
    await user.click(screen.getByRole('button', { name: 'Send OTP' }));
    await screen.findByLabelText('Verification Code');
    await user.click(screen.getByRole('button', { name: 'Verify email' }));

    expect(await screen.findByText('OTP must be 6 digits')).toBeInTheDocument();
  });

  it('disables the email field once the OTP step begins', async () => {
    const user = userEvent.setup();
    renderForm(<VerifyEmailForm />, { route: '/auth/verify-email' });
    await user.type(screen.getByLabelText('Email'), 'student@example.com');
    await user.click(screen.getByRole('button', { name: 'Send OTP' }));
    await screen.findByLabelText('Verification Code');
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });
});
