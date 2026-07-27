import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking_status_changed', 'new_booking', 'task_assigned', 'vendor_status_changed', 'message_received'],
      required: true,
    },
    message: { type: String, required: true },
    relatedBookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type NotificationDoc = HydratedDocument<InferSchemaType<typeof NotificationSchema>>;

export const Notification = model('Notification', NotificationSchema);
