import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';

export interface UploadedFile {
  url: string;
  publicId: string;
  name?: string;
  duration?: number;
}

export const uploadApi = {
  image: (file: File, onProgress?: (percent: number) => void, signal?: AbortSignal) =>
    uploadFile('/upload/image', file, onProgress, signal),
  video: (file: File, onProgress?: (percent: number) => void, signal?: AbortSignal) =>
    uploadFile('/upload/video', file, onProgress, signal),
  document: (file: File, onProgress?: (percent: number) => void, signal?: AbortSignal) =>
    uploadFile('/upload/document', file, onProgress, signal),
};

async function uploadFile(path: string, file: File, onProgress?: (percent: number) => void, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axiosInstance.post<ApiResponse<UploadedFile>>(path, formData, {
    signal,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  return res.data.data;
}
