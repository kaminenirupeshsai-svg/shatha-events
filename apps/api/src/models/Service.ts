import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const SERVICE_CATEGORIES = [
  'decor_styling',
  'photography_film',
  'catering_hospitality',
  'venue_logistics',
  'entertainment_activities',
] as const;

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true, index: true },
    description: { type: String, required: true },
    priceRange: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    images: { type: [String], default: [] },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isActive: { type: Boolean, default: true },
    // Denormalized from the Review collection (see reviews.service.ts) so
    // service cards/listings can show a rating without a query per card.
    // Always recomputed from source, never incremented in place.
    avgRating: { type: Number, default: null },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ServiceDoc = HydratedDocument<InferSchemaType<typeof ServiceSchema>>;

export const Service = model('Service', ServiceSchema);
