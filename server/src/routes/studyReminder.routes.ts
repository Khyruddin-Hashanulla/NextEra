import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as reminderController from '../controllers/studyReminder.controller';
import { createReminderSchema, updateReminderSchema } from '../validators/studyReminder.validator';

const router = Router();

router.use(authenticate);

router.get('/', reminderController.getUserReminders);
router.post('/', validate(createReminderSchema), reminderController.createReminder);
router.put('/:id', validate(updateReminderSchema), reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.post('/:id/toggle', reminderController.toggleReminder);

export default router;
