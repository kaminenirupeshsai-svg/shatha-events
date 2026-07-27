import type { ReviewDto } from '@app/shared';
import type { ReviewDoc } from '../../models/Review.js';

interface MaybePopulatedUser {
  _id: { toString(): string };
  name?: string;
}

export function toReviewDto(doc: ReviewDoc): ReviewDto {
  const client = doc.clientId as unknown as MaybePopulatedUser;
  const clientPopulated = Boolean(client && typeof client === 'object' && 'name' in client);
  return {
    id: doc._id.toString(),
    bookingId: doc.bookingId.toString(),
    clientId: client._id.toString(),
    clientName: clientPopulated ? (client.name ?? '') : '',
    vendorId: doc.vendorId.toString(),
    serviceId: doc.serviceId.toString(),
    rating: doc.rating,
    comment: doc.comment ?? null,
    createdAt: (doc.createdAt as unknown as Date).toISOString(),
  };
}
