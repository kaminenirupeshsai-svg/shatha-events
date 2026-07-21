import { Router } from 'express';
import { z } from 'zod';
import { CreateTaskInputSchema, MongoIdSchema, UpdateTaskStatusInputSchema } from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import * as tasksController from './tasks.controller.js';

const IdParamsSchema = z.object({ id: MongoIdSchema });

/**
 * Booking-scoped task management, mounted at /api/bookings/:id/tasks by
 * modules/bookings/bookings.routes.ts with mergeParams so :id resolves to
 * the booking id here. Internal ops work, so admin-only.
 */
export const bookingTasksRouter = Router({ mergeParams: true });
bookingTasksRouter.use(auth, requireRole('admin'));
bookingTasksRouter.post('/', validate(CreateTaskInputSchema), tasksController.createForBooking);
bookingTasksRouter.get('/', tasksController.listForBooking);

/** Top-level, mounted at /api/tasks - self-service for whoever a task is assigned to. */
export const tasksRouter = Router();
tasksRouter.use(auth);
tasksRouter.get('/mine', tasksController.listMine);
tasksRouter.patch(
  '/:id/status',
  validate(IdParamsSchema, 'params'),
  validate(UpdateTaskStatusInputSchema),
  tasksController.updateStatus,
);
