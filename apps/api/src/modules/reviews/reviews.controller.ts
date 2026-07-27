import type { Request, Response } from 'express';
import type { PaginationQuery } from '@app/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import * as reviewsService from './reviews.service.js';

// bookingId/serviceId both arrive as :id because these controllers are
// mounted at /api/bookings/:id/reviews and /api/services/:id/reviews
// respectively (mergeParams on each nested router) - same pattern as
// modules/tasks/tasks.controller.ts.

export const create = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewsService.createReview(req.user!, req.params.id as string, req.body);
  res.status(201).json(review);
});

export const listForBooking = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewsService.listForBooking(req.params.id as string, req.user!);
  res.status(200).json(reviews);
});

export const listForService = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewsService.listForService(req.params.id as string, req.query as unknown as PaginationQuery);
  res.status(200).json(result);
});
