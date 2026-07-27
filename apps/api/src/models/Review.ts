import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const ReviewSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: null },
  },
  { timestamps: true },
);

// One review per service per booking - a client can rate each vendor on a
// multi-vendor booking once, not spam the same service repeatedly.
ReviewSchema.index({ bookingId: 1, serviceId: 1 }, { unique: true });

export type ReviewDoc = HydratedDocument<InferSchemaType<typeof ReviewSchema>>;

export const Review = model('Review', ReviewSchema);
