import axiosInstance from '../axiosInstance';

export interface StudyReminder {
  _id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'one-time';
  dayOfWeek?: number;
  time: string;
  course?: { _id: string; title: string };
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

export const studyReminderApi = {
  list: (signal?: AbortSignal) => axiosInstance.get<{ data: StudyReminder[] }>('/study-reminders', { signal }),

  create: (
    data: {
      title: string;
      description?: string;
      type: 'daily' | 'weekly' | 'one-time';
      dayOfWeek?: number;
      time: string;
      course?: string;
    },
    signal?: AbortSignal
  ) => axiosInstance.post<{ data: StudyReminder }>('/study-reminders', data, { signal }),

  update: (id: string, data: Partial<StudyReminder>, signal?: AbortSignal) =>
    axiosInstance.put<{ data: StudyReminder }>(`/study-reminders/${id}`, data, { signal }),

  delete: (id: string, signal?: AbortSignal) => axiosInstance.delete(`/study-reminders/${id}`, { signal }),

  toggle: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: StudyReminder }>(`/study-reminders/${id}/toggle`, undefined, { signal }),
};
