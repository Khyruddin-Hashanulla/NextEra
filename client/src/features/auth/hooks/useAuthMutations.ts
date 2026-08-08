import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useNavigate } from 'react-router-dom';
import { ROUTES, getDashboardRoute } from '@/lib/constants';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export function useLoginMutation() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (user) => {
      addToast({ title: 'Login successful', variant: 'success' });
      navigate(getDashboardRoute(user.role), { replace: true });
    },
    onError: (error: AxiosError<ApiError>) => {
      addToast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'error',
      });
    },
  });
}

export function useRegisterMutation() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      register(name, email, password),
    onSuccess: () => {
      addToast({
        title: 'Registration successful',
        description: 'Verify your email to activate your account',
        variant: 'success',
      });
      navigate(ROUTES.VERIFY_EMAIL);
    },
    onError: (error: AxiosError<ApiError>) => {
      addToast({
        title: 'Registration failed',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'error',
      });
    },
  });
}

export function useSendOTPMutation() {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (email: string) => authApi.sendOTP(email),
    onSuccess: () => {
      addToast({ title: 'OTP sent successfully', variant: 'success' });
    },
    onError: (error: AxiosError<ApiError>) => {
      addToast({
        title: 'Failed to send OTP',
        description: error.response?.data?.message,
        variant: 'error',
      });
    },
  });
}

export function useVerifyEmailMutation() {
  const { verifyEmail } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyEmail(email, otp),
    onSuccess: (user) => {
      addToast({ title: 'Email verified successfully', variant: 'success' });
      navigate(getDashboardRoute(user.role), { replace: true });
    },
    onError: (error: AxiosError<ApiError>) => {
      addToast({
        title: 'Verification failed',
        description: error.response?.data?.message,
        variant: 'error',
      });
    },
  });
}

export function useForgotPasswordMutation() {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword({ email }),
    onSuccess: () => {
      addToast({
        title: 'Password reset link sent',
        description: 'Check your email for the reset link',
        variant: 'success',
      });
    },
    onError: (error: AxiosError<ApiError>) => {
      addToast({
        title: 'Failed',
        description: error.response?.data?.message,
        variant: 'error',
      });
    },
  });
}

export function useResetPasswordMutation() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword({ token, password }),
    onSuccess: () => {
      addToast({ title: 'Password reset successful', variant: 'success' });
      navigate(ROUTES.LOGIN);
    },
    onError: (error: AxiosError<ApiError>) => {
      addToast({
        title: 'Reset failed',
        description: error.response?.data?.message,
        variant: 'error',
      });
    },
  });
}
