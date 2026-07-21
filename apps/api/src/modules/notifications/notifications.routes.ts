import { Router } from 'express';
import { z } from 'zod';
import { MongoIdSchema, NotificationListQuerySchema } from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as notificationsController from './notifications.controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(auth);

notificationsRouter.get('/', validate(NotificationListQuerySchema, 'query'), notificationsController.list);
notificationsRouter.get('/unread-count', notificationsController.getUnreadCount);
notificationsRouter.patch('/read-all', notificationsController.markAllRead);
notificationsRouter.patch(
  '/:id/read',
  validate(z.object({ id: MongoIdSchema }), 'params'),
  notificationsController.markRead,
);
