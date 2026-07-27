import { StudyReminder } from '../models/studyReminder.model';
import { ApiError } from '../utils/ApiError';

export const createReminder = async (userId: string, data: {
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'one-time';
  dayOfWeek?: number;
  time: string;
  course?: string;
}) => {
  if (data.type === 'weekly' && data.dayOfWeek === undefined) {
    throw ApiError.badRequest('dayOfWeek is required for weekly reminders');
  }
  return StudyReminder.create({ ...data, user: userId });
};

export const getUserReminders = async (userId: string) => {
  return StudyReminder.find({ user: userId })
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateReminder = async (reminderId: string, userId: string, data: Partial<{
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'one-time';
  dayOfWeek: number;
  time: string;
  course: string;
  isActive: boolean;
}>) => {
  const reminder = await StudyReminder.findOne({ _id: reminderId, user: userId });
  if (!reminder) throw ApiError.notFound('Reminder not found');
  Object.assign(reminder, data);
  await reminder.save();
  return reminder;
};

export const deleteReminder = async (reminderId: string, userId: string) => {
  const reminder = await StudyReminder.findOneAndDelete({ _id: reminderId, user: userId });
  if (!reminder) throw ApiError.notFound('Reminder not found');
};

export const toggleReminder = async (reminderId: string, userId: string) => {
  const reminder = await StudyReminder.findOne({ _id: reminderId, user: userId });
  if (!reminder) throw ApiError.notFound('Reminder not found');
  reminder.isActive = !reminder.isActive;
  await reminder.save();
  return reminder;
};
