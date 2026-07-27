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
  list: () => axiosInstance.get<{ data: StudyReminder[] }>('/study-reminders'),

  create: (data: {
    title: string;
    description?: string;
    type: 'daily' | 'weekly' | 'one-time';
    dayOfWeek?: number;
    time: string;
    course?: string;
  }) => axiosInstance.post<{ data: StudyReminder }>('/study-reminders', data),

  update: (id: string, data: Partial<StudyReminder>) =>
    axiosInstance.put<{ data: StudyReminder }>(`/study-reminders/${id}`, data),

  delete: (id: string) => axiosInstance.delete(`/study-reminders/${id}`),

  toggle: (id: string) => axiosInstance.post<{ data: StudyReminder }>(`/study-reminders/${id}/toggle`),
};
