import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenResponse,
} from '@/types/auth';

export const authApi = {
  register: (data: RegisterRequest, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<AuthResponse['user']>>('/auth/register', data, { signal }),

  login: (data: LoginRequest, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data, { signal }),

  googleAuth: (credential: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/auth/google', { credential }, { signal }),

  sendOTP: (email: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<null>>('/auth/send-otp', { email }, { signal }),

  verifyEmail: (data: VerifyEmailRequest, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/auth/verify-email', data, { signal }),

  refreshToken: (refreshToken: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', { refreshToken }, { signal }),

  forgotPassword: (data: ForgotPasswordRequest, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', data, { signal }),

  resetPassword: (data: ResetPasswordRequest, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', data, { signal }),

  logout: (signal?: AbortSignal) => axiosInstance.post<ApiResponse<null>>('/auth/logout', undefined, { signal }),
};
