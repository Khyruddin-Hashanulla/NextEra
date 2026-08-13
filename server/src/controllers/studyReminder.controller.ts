import { Request, Response, NextFunction } from 'express';
import * as reminderService from '../services/studyReminder.service';

export const createReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await reminderService.createReminder(req.currentUser!.userId, req.body);
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
};

export const getUserReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminders = await reminderService.getUserReminders(req.currentUser!.userId);
    res.json({ success: true, data: reminders });
  } catch (err) {
    next(err);
  }
};

export const updateReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await reminderService.updateReminder(req.params.id, req.currentUser!.userId, req.body);
    res.json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
};

export const deleteReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reminderService.deleteReminder(req.params.id, req.currentUser!.userId);
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
};

export const toggleReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await reminderService.toggleReminder(req.params.id, req.currentUser!.userId);
    res.json({ success: true, data: reminder });
  } catch (err) {
    next(err);
  }
};
