import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { OAuthCallbackPage } from '@/features/auth/pages/OAuthCallbackPage';

function wrap(ui: React.ReactNode, options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(
    <GoogleOAuthProvider clientId="test-client-id">{ui}</GoogleOAuthProvider>,
    options,
  );
}

describe('Auth pages', () => {
  it('LoginPage renders the login form', () => {
    wrap(<LoginPage />, { route: '/auth/login', mockAuth: createAuthValue() });
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /NextEra/ })).toBeInTheDocument();
  });

  it('RegisterPage renders the register form', () => {
    wrap(<RegisterPage />, { route: '/auth/register', mockAuth: createAuthValue() });
    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
  });

  it('ForgotPasswordPage renders the forgot password form', () => {
    wrap(<ForgotPasswordPage />, { route: '/auth/forgot-password' });
    expect(screen.getByRole('heading', { name: 'Forgot password?' })).toBeInTheDocument();
  });

  it('ResetPasswordPage renders the reset form with a token', () => {
    wrap(<ResetPasswordPage />, { route: '/auth/reset-password?token=xyz' });
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
  });

  it('VerifyEmailPage renders the verify email form', () => {
    wrap(<VerifyEmailPage />, { route: '/auth/verify-email' });
    expect(screen.getByRole('heading', { name: 'Verify your email' })).toBeInTheDocument();
  });
});

describe('OAuthCallbackPage', () => {
  it('shows an error state when no access token is present', async () => {
    wrap(<OAuthCallbackPage />, {
      route: '/auth/oauth-callback',
      mockAuth: createAuthValue(),
    });
    expect(await screen.findByRole('heading', { name: 'Authentication Failed' })).toBeInTheDocument();
    expect(screen.getByText('No access token received')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to login/ })).toBeInTheDocument();
  });

  it('stores the token and redirects to the dashboard on success', async () => {
    const setUser = vi.fn();
    wrap(<OAuthCallbackPage />, {
      route: '/auth/oauth-callback?accessToken=google-token',
      mockAuth: createAuthValue({ setUser }),
    });
    expect(await screen.findByRole('heading', { name: 'Signed in successfully!' })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('google-token');
    expect(setUser).toHaveBeenCalled();
  });
});
