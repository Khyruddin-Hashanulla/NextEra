import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '@/types/user';

export const userApi = {
  getMe: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<User>>('/users/me', { signal }),

  updateProfile: (data: UpdateProfileRequest, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<User>>('/users/me', data, { signal }),

  changePassword: (data: ChangePasswordRequest, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<null>>('/users/me/password', data, { signal }),
};
