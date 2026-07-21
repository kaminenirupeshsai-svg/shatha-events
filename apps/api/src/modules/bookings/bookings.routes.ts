import { Router } from 'express';
import { z } from 'zod';
import {
  BookingListQuerySchema,
  CreateBookingInputSchema,
  MongoIdSchema,
  UpdateBookingStatusInputSchema,
} from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import { bookingTasksRouter } from '../tasks/tasks.routes.js';
import * as bookingsController from './bookings.controller.js';

const IdParamsSchema = z.object({ id: MongoIdSchema });

export const bookingsRouter = Router();

bookingsRouter.use(auth);

// IMPORTANT: /my and /vendor must be declared before the /:id family so
// Express doesn't swallow them as a MongoIdSchema-validated :id.
bookingsRouter.get('/my', requireRole('client'), validate(BookingListQuerySchema, 'query'), bookingsController.listMine);
bookingsRouter.get(
  '/vendor',
  requireRole('vendor'),
  validate(BookingListQuerySchema, 'query'),
  bookingsController.listVendor,
);
bookingsRouter.get(
  '/',
  requireRole('admin'),
  validate(BookingListQuerySchema, 'query'),
  bookingsController.listAll,
);

bookingsRouter.post('/', requireRole('client'), validate(CreateBookingInputSchema), bookingsController.create);

bookingsRouter.get('/:id', validate(IdParamsSchema, 'params'), bookingsController.getById);

bookingsRouter.patch(
  '/:id/status',
  validate(IdParamsSchema, 'params'),
  validate(UpdateBookingStatusInputSchema),
  bookingsController.updateStatus,
);

// Nested task management for a specific booking - admin-only, see modules/tasks.
bookingsRouter.use('/:id/tasks', validate(IdParamsSchema, 'params'), bookingTasksRouter);
