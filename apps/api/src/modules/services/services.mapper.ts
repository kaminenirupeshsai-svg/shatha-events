import type { ServiceDto } from '@app/shared';
import type { ServiceDoc } from '../../models/Service.js';

// `vendorId` is either a bare ObjectId (not populated) or a populated
// { _id, name } document depending on the query - both shapes are handled
// here so callers don't need to know which one they got.
interface MaybePopulatedVendor {
  _id: { toString(): string };
  name?: string;
}

export function toServiceDto(doc: ServiceDoc): ServiceDto {
  const vendor = doc.vendorId as unknown as MaybePopulatedVendor | null;
  const isPopulated = Boolean(vendor && typeof vendor === 'object' && 'name' in vendor);
  return {
    id: doc._id.toString(),
    title: doc.title,
    category: doc.category as ServiceDto['category'],
    description: doc.description,
    priceRange: { min: doc.priceRange!.min, max: doc.priceRange!.max },
    images: doc.images ?? [],
    vendorId: vendor ? vendor._id.toString() : null,
    vendorName: isPopulated ? (vendor?.name ?? null) : null,
    isActive: doc.isActive,
    avgRating: doc.avgRating ?? null,
    reviewCount: doc.reviewCount ?? 0,
    createdAt: (doc.createdAt as unknown as Date).toISOString(),
  };
}
