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
  register: (data: RegisterRequest) =>
    axiosInstance.post<ApiResponse<AuthResponse['user']>>('/auth/register', data),

  login: (data: LoginRequest) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data),

  googleAuth: (credential: string) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/auth/google', { credential }),

  sendOTP: (email: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/send-otp', { email }),

  verifyEmail: (data: VerifyEmailRequest) =>
    axiosInstance.post<ApiResponse<null>>('/auth/verify-email', data),

  refreshToken: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', { refreshToken }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', data),

  logout: () =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout'),
};
