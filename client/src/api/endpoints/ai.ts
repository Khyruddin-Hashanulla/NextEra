import axiosInstance from '../axiosInstance';

export const aiApi = {
  generateDescription: (data: { title: string; category: string; level: string; keywords?: string[] }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/generate-description', data, { signal }),

  generateQuiz: (data: { topic: string; count?: number; difficulty?: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/generate-quiz', data, { signal }),

  generateAssignment: (data: { topic: string; duration: string; skills: string[] }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/generate-assignment', data, { signal }),

  chat: (data: { message: string; history?: { role: string; content: string }[] }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { content: string } }>('/ai/chat', data, { signal }),
};
