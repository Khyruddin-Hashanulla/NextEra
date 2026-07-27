import axiosInstance from '../axiosInstance';

export const aiApi = {
  generateDescription: (data: { title: string; category: string; level: string; keywords?: string[] }) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/generate-description', data),

  generateQuiz: (data: { topic: string; count?: number; difficulty?: string }) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/generate-quiz', data),

  generateAssignment: (data: { topic: string; duration: string; skills: string[] }) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/generate-assignment', data),

  chat: (data: { message: string; history?: { role: string; content: string }[] }) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/chat', data),
};
