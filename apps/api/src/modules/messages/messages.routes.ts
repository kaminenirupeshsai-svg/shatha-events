import { Router } from 'express';
import { z } from 'zod';
import { CreateMessageInputSchema, MongoIdSchema } from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import * as messagesController from './messages.controller.js';

const VendorParamSchema = z.object({ vendorId: MongoIdSchema });

/**
 * Mounted at /api/bookings/:id/messages with mergeParams (see
 * bookings.routes.ts), so :id resolves to the booking id here; :vendorId is
 * this router's own segment, selecting which (booking, vendor) thread.
 * Viewing is open to whoever can see the booking (service layer enforces the
 * exact rule); only the client and that specific vendor can post.
 */
export const bookingMessagesRouter = Router({ mergeParams: true });
bookingMessagesRouter.use(auth);
bookingMessagesRouter.get('/:vendorId', validate(VendorParamSchema, 'params'), messagesController.listThread);
bookingMessagesRouter.post(
  '/:vendorId',
  requireRole('client', 'vendor'),
  validate(VendorParamSchema, 'params'),
  validate(CreateMessageInputSchema),
  messagesController.sendMessage,
);
