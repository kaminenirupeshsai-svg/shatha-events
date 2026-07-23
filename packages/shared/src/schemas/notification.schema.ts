import { z } from 'zod';
import { MongoIdSchema, PaginationQuerySchema } from './common.schema.js';

export const NotificationTypeSchema = z.enum([
  'booking_status_changed',
  'new_booking',
  'task_assigned',
  'vendor_status_changed',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationDtoSchema = z.object({
  id: MongoIdSchema,
  type: NotificationTypeSchema,
  message: z.string(),
  relatedBookingId: MongoIdSchema.nullable(),
  isRead: z.boolean(),
  createdAt: z.string(),
});
export type NotificationDto = z.infer<typeof NotificationDtoSchema>;

// Socket.io event payloads — kept alongside the REST DTOs since both describe
// the same underlying event, just delivered over two different transports.
export const NotificationSocketEventSchema = z.object({
  notification: NotificationDtoSchema,
});

export const BookingStatusChangedSocketEventSchema = z.object({
  bookingId: MongoIdSchema,
  status: z.string(),
});

export const NotificationListQuerySchema = PaginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
});
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
