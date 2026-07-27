import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const MessageSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    // Identifies which (booking, vendor) thread this belongs to - a booking
    // can span multiple vendors, and each gets its own private conversation
    // with the client rather than one shared thread everyone sees.
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

MessageSchema.index({ bookingId: 1, vendorId: 1, createdAt: 1 });

export type MessageDoc = HydratedDocument<InferSchemaType<typeof MessageSchema>>;

export const Message = model('Message', MessageSchema);
