import { z } from 'zod';

export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z.string().regex(OBJECT_ID_REGEX, 'Invalid ObjectId');

export const notificationIdParamSchema = z.object({ id: objectIdSchema });
