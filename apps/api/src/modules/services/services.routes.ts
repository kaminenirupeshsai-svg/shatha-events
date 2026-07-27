import { Router } from 'express';
import { z } from 'zod';
import { CreateServiceInputSchema, MongoIdSchema, ServiceListQuerySchema, UpdateServiceInputSchema } from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import { imageUpload } from '../../middleware/upload.js';
import { uploadRateLimiter } from '../../middleware/rate-limit.js';
import { serviceReviewsRouter } from '../reviews/reviews.routes.js';
import * as servicesController from './services.controller.js';

const IdParamsSchema = z.object({ id: MongoIdSchema });

export const servicesRouter = Router();

servicesRouter.get('/', validate(ServiceListQuerySchema, 'query'), servicesController.list);
servicesRouter.get('/:id', validate(IdParamsSchema, 'params'), servicesController.getById);

servicesRouter.post(
  '/',
  auth,
  requireRole('vendor', 'admin'),
  validate(CreateServiceInputSchema),
  servicesController.create,
);

servicesRouter.patch(
  '/:id',
  auth,
  requireRole('vendor', 'admin'),
  validate(IdParamsSchema, 'params'),
  validate(UpdateServiceInputSchema),
  servicesController.update,
);

servicesRouter.delete(
  '/:id',
  auth,
  requireRole('vendor', 'admin'),
  validate(IdParamsSchema, 'params'),
  servicesController.remove,
);

servicesRouter.post(
  '/:id/images',
  auth,
  requireRole('vendor', 'admin'),
  uploadRateLimiter,
  validate(IdParamsSchema, 'params'),
  imageUpload.array('images', 5),
  servicesController.uploadImages,
);

// Public review list for a service - see modules/reviews.
servicesRouter.use('/:id/reviews', validate(IdParamsSchema, 'params'), serviceReviewsRouter);
