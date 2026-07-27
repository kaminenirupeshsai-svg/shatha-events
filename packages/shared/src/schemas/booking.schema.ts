import { z } from 'zod';
import { MongoIdSchema, PaginationQuerySchema } from './common.schema.js';

export const EventTypeSchema = z.enum(['wedding', 'corporate', 'birthday', 'social']);
export type EventType = z.infer<typeof EventTypeSchema>;

export const BookingStatusSchema = z.enum([
  'pending',
  'reviewed',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

// The only forward transitions an admin may apply via PATCH /bookings/:id/status.
// Enforced server-side too — this is the shared source of truth for both.
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['reviewed', 'cancelled'],
  reviewed: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const BookingServiceItemSchema = z.object({
  serviceId: MongoIdSchema,
  notes: z.string().trim().max(300).optional(),
});

export const CreateBookingInputSchema = z.object({
  eventType: EventTypeSchema,
  eventDate: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: 'Event date must be in the future',
  }),
  guestCount: z.coerce.number().int().min(1).max(20000),
  services: z.array(BookingServiceItemSchema).min(1, 'Select at least one service'),
  budget: z.coerce.number().min(0).optional(),
  message: z.string().trim().max(2000).optional(),
});
export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;

export const UpdateBookingStatusInputSchema = z.object({
  status: BookingStatusSchema,
  note: z.string().trim().max(500).optional(),
});
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusInputSchema>;

export const StatusHistoryEntrySchema = z.object({
  status: BookingStatusSchema,
  changedAt: z.string(),
  note: z.string().nullable(),
});

export const BookingDtoSchema = z.object({
  id: MongoIdSchema,
  clientId: MongoIdSchema,
  clientName: z.string(),
  eventType: EventTypeSchema,
  eventDate: z.string(),
  guestCount: z.number(),
  services: z.array(
    z.object({
      serviceId: MongoIdSchema,
      title: z.string(),
      notes: z.string().nullable(),
      vendorId: MongoIdSchema.nullable(),
      vendorName: z.string().nullable(),
    }),
  ),
  budget: z.number().nullable(),
  message: z.string().nullable(),
  status: BookingStatusSchema,
  assignedAdminId: MongoIdSchema.nullable(),
  assignedAdminName: z.string().nullable(),
  statusHistory: z.array(StatusHistoryEntrySchema),
  createdAt: z.string(),
});
export type BookingDto = z.infer<typeof BookingDtoSchema>;

export const BookingListQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(200).optional(),
  status: BookingStatusSchema.optional(),
  sort: z.enum(['newest', 'event_date']).default('newest'),
});
export type BookingListQuery = z.infer<typeof BookingListQuerySchema>;
