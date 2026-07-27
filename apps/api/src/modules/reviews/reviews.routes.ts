import { Router } from 'express';
import { CreateReviewInputSchema, PaginationQuerySchema } from '@app/shared';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import * as reviewsController from './reviews.controller.js';

/**
 * Booking-scoped: mounted at /api/bookings/:id/reviews with mergeParams (see
 * modules/bookings/bookings.routes.ts), so :id resolves to the booking id
 * here. Listing is open to whoever can view the booking itself; only the
 * booking's own client can post a review.
 */
export const bookingReviewsRouter = Router({ mergeParams: true });
bookingReviewsRouter.use(auth);
bookingReviewsRouter.post('/', requireRole('client'), validate(CreateReviewInputSchema), reviewsController.create);
bookingReviewsRouter.get('/', reviewsController.listForBooking);

/**
 * Service-scoped: mounted at /api/services/:id/reviews with mergeParams (see
 * modules/services/services.routes.ts). Public - no auth required, same as
 * the service listing/detail routes it accompanies.
 */
export const serviceReviewsRouter = Router({ mergeParams: true });
serviceReviewsRouter.get('/', validate(PaginationQuerySchema, 'query'), reviewsController.listForService);
