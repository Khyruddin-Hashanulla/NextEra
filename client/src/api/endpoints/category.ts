import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import { Category } from '@/types/admin';

export const categoryApi = {
  listCategories: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<Category[]>>('/categories', { signal }),
};
