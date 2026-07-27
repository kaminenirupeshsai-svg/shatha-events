import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const EVENT_TYPES = ['wedding', 'corporate', 'birthday', 'social'] as const;
const BOOKING_STATUSES = [
  'pending',
  'reviewed',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

const BookingServiceItemSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    title: { type: String, required: true },
    notes: { type: String, default: null },
    // Snapshotted from the Service at booking-creation time (like title
    // already is), not looked up live - stays accurate even if the service
    // is later reassigned or deleted. Null on bookings created before this
    // field existed; the messaging feature just has nothing to show there.
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const StatusHistoryEntrySchema = new Schema(
  {
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    changedAt: { type: Date, required: true, default: () => new Date() },
    note: { type: String, default: null },
  },
  { _id: false },
);

const BookingSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    eventDate: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    services: { type: [BookingServiceItemSchema], default: [] },
    budget: { type: Number, default: null },
    message: { type: String, default: null },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    statusHistory: { type: [StatusHistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

export type BookingDoc = HydratedDocument<InferSchemaType<typeof BookingSchema>>;

export const Booking = model('Booking', BookingSchema);
