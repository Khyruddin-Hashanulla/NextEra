import { describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { createAuthValue } from '@/test/mocks/providers';
import { TOKEN_KEYS } from '@/lib/constants';
import { buildUserWithRole } from '@/test/factories';
import {
  useLoginMutation,
  useRegisterMutation,
  useSendOTPMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '@/features/auth/hooks/useAuthMutations';

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function LoginHarness({ email, password }: { email: string; password: string }) {
  const mutation = useLoginMutation();
  useEffect(() => {
    mutation.mutate({ email, password });
  }, [email, password]);
  return <PathProbe />;
}

function RegisterHarness({ name, email, password }: { name: string; email: string; password: string }) {
  const mutation = useRegisterMutation();
  const { pathname } = useLocation();
  useEffect(() => {
    mutation.mutate({ name, email, password });
  }, [name, email, password]);
  return <span>{pathname}</span>;
}

function SendOtpHarness({ email }: { email: string }) {
  const mutation = useSendOTPMutation();
  useEffect(() => {
    mutation.mutate(email);
  }, [email]);
  return null;
}

function VerifyEmailHarness({ email, otp }: { email: string; otp: string }) {
  const mutation = useVerifyEmailMutation();
  const { pathname } = useLocation();
  useEffect(() => {
    mutation.mutate({ email, otp });
  }, [email, otp]);
  return <span>{pathname}</span>;
}

function ForgotPasswordHarness({ email }: { email: string }) {
  const mutation = useForgotPasswordMutation();
  useEffect(() => {
    mutation.mutate(email);
  }, [email]);
  return null;
}

function ResetPasswordHarness({ token, password }: { token: string; password: string }) {
  const mutation = useResetPasswordMutation();
  const { pathname } = useLocation();
  useEffect(() => {
    mutation.mutate({ token, password });
  }, [token, password]);
  return <span>{pathname}</span>;
}

describe('useLoginMutation', () => {
  it('navigates to the student dashboard for a student on success', async () => {
    const auth = createAuthValue({
      login: vi.fn(async () => buildUserWithRole('student')),
    });
    renderWithProviders(<LoginHarness email="student@example.com" password="Password1" />, {
      route: '/login',
      mockAuth: auth,
    });

    await waitFor(() => expect(screen.getByText('/student')).toBeInTheDocument());
    expect(auth.login).toHaveBeenCalledWith('student@example.com', 'Password1');
    expect(screen.getByRole('alert')).toHaveTextContent('Login successful');
  });

  it('navigates to the instructor dashboard for an instructor on success', async () => {
    const auth = createAuthValue({
      login: vi.fn(async () => buildUserWithRole('instructor')),
    });
    renderWithProviders(<LoginHarness email="instructor@example.com" password="Password1" />, {
      route: '/login',
      mockAuth: auth,
    });

    await waitFor(() => expect(screen.getByText('/instructor')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Login successful');
  });

  it('navigates to the admin dashboard for an admin on success', async () => {
    const auth = createAuthValue({
      login: vi.fn(async () => buildUserWithRole('admin')),
    });
    renderWithProviders(<LoginHarness email="admin@example.com" password="Password1" />, {
      route: '/login',
      mockAuth: auth,
    });

    await waitFor(() => expect(screen.getByText('/admin')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Login successful');
  });

  it('shows an error toast and stays put when login fails', async () => {
    const error = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 401,
      data: { message: 'Invalid credentials' },
      statusText: 'Unauthorized',
      headers: {},
      config: {} as any,
    });
    const auth = createAuthValue({ login: () => Promise.reject(error) });
    renderWithProviders(<LoginHarness email="student@example.com" password="wrong" />, {
      route: '/login',
      mockAuth: auth,
    });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Login failed'));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(screen.getByText('/login')).toBeInTheDocument();
  });
});

describe('useRegisterMutation', () => {
  it('navigates to email verification and shows a success toast', async () => {
    const auth = createAuthValue({
      register: vi.fn(async () => {}),
    });
    renderWithProviders(<RegisterHarness name="Jane" email="j@x.com" password="Password1" />, {
      route: '/register',
      mockAuth: auth,
    });

    await waitFor(() => expect(screen.getByText('/auth/verify-email')).toBeInTheDocument());
    expect(auth.register).toHaveBeenCalledWith('Jane', 'j@x.com', 'Password1');
    expect(screen.getByRole('alert')).toHaveTextContent('Registration successful');
  });

  it('shows an error toast when registration fails', async () => {
    const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      data: { message: 'Email already exists' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as any,
    });
    const auth = createAuthValue({ register: () => Promise.reject(error) });
    renderWithProviders(<RegisterHarness name="Jane" email="j@x.com" password="Password1" />, {
      route: '/register',
      mockAuth: auth,
    });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Registration failed'));
    expect(screen.getByRole('alert')).toHaveTextContent('Email already exists');
  });
});

describe('useSendOTPMutation', () => {
  it('shows a success toast when the OTP is sent', async () => {
    renderWithProviders(<SendOtpHarness email="j@x.com" />, { route: '/auth/verify-email' });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('OTP sent successfully'));
  });

  it('shows an error toast when sending fails', async () => {
    renderWithProviders(<SendOtpHarness email="" />, { route: '/auth/verify-email' });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to send OTP'));
  });
});

describe('useVerifyEmailMutation', () => {
  it('auto-authenticates and navigates to the role dashboard on success', async () => {
    renderWithProviders(<VerifyEmailHarness email="j@x.com" otp="123456" />, {
      route: '/auth/verify-email',
    });
    await waitFor(() => expect(screen.getByText('/student')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Email verified successfully');
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBe('test-access-token');
  });

  it('shows an error toast for a bad OTP', async () => {
    renderWithProviders(<VerifyEmailHarness email="j@x.com" otp="000000" />, {
      route: '/auth/verify-email',
    });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Verification failed'));
  });
});

describe('useForgotPasswordMutation', () => {
  it('shows a success toast', async () => {
    renderWithProviders(<ForgotPasswordHarness email="j@x.com" />, { route: '/auth/forgot-password' });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Password reset link sent'));
  });

  it('shows an error toast when the email is missing', async () => {
    renderWithProviders(<ForgotPasswordHarness email="" />, { route: '/auth/forgot-password' });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed'));
  });
});

describe('useResetPasswordMutation', () => {
  it('navigates to login on success', async () => {
    renderWithProviders(<ResetPasswordHarness token="t" password="NewPass1" />, {
      route: '/auth/reset-password',
    });
    await waitFor(() => expect(screen.getByText('/auth/login')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Password reset successful');
  });

  it('shows an error toast when reset fails', async () => {
    renderWithProviders(<ResetPasswordHarness token="t" password="" />, {
      route: '/auth/reset-password',
    });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Reset failed'));
  });
});
