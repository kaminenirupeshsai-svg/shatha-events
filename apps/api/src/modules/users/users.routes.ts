import { Router } from 'express';
import { z } from 'zod';
import {
  MongoIdSchema,
  PaginationQuerySchema,
  UpdatePasswordInputSchema,
  UpdateProfileInputSchema,
  UpdateSettingsInputSchema,
  UpdateVendorStatusInputSchema,
  UserRoleSchema,
} from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import { imageUpload } from '../../middleware/upload.js';
import { uploadRateLimiter } from '../../middleware/rate-limit.js';
import * as usersController from './users.controller.js';

const UserListQuerySchema = PaginationQuerySchema.extend({
  role: UserRoleSchema.optional(),
  q: z.string().trim().max(200).optional(),
});

export const usersRouter = Router();

usersRouter.use(auth);

usersRouter.get('/me', usersController.me);
usersRouter.patch('/me', validate(UpdateProfileInputSchema), usersController.updateMe);
usersRouter.patch('/me/password', validate(UpdatePasswordInputSchema), usersController.updatePassword);
usersRouter.patch('/me/settings', validate(UpdateSettingsInputSchema), usersController.updateSettings);
usersRouter.post('/me/avatar', uploadRateLimiter, imageUpload.single('avatar'), usersController.uploadAvatar);

usersRouter.get('/', validate(UserListQuerySchema, 'query'), usersController.list);
usersRouter.get(
  '/:id',
  requireRole('admin'),
  validate(z.object({ id: MongoIdSchema }), 'params'),
  usersController.getById,
);
usersRouter.patch(
  '/:id/vendor-status',
  requireRole('admin'),
  validate(z.object({ id: MongoIdSchema }), 'params'),
  validate(UpdateVendorStatusInputSchema),
  usersController.updateVendorStatus,
);
