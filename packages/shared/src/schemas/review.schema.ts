import { z } from 'zod';
import { MongoIdSchema, PaginationQuerySchema } from './common.schema.js';

export const CreateReviewInputSchema = z.object({
  serviceId: MongoIdSchema,
  rating: z.coerce.number().int().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;

export const ReviewDtoSchema = z.object({
  id: MongoIdSchema,
  bookingId: MongoIdSchema,
  clientId: MongoIdSchema,
  clientName: z.string(),
  vendorId: MongoIdSchema,
  serviceId: MongoIdSchema,
  rating: z.number(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});
export type ReviewDto = z.infer<typeof ReviewDtoSchema>;

export const ReviewListQuerySchema = PaginationQuerySchema;
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;
