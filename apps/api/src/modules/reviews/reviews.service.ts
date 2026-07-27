import type { CreateReviewInput, PaginationQuery } from '@app/shared';
import { Review } from '../../models/Review.js';
import { Booking } from '../../models/Booking.js';
import { Service } from '../../models/Service.js';
import { AppError } from '../../lib/app-error.js';
import { buildPaginatedResult } from '../../lib/pagination.js';
import type { AuthUser } from '../../middleware/auth.js';
import { assertCanView } from '../bookings/bookings.service.js';
import { toReviewDto } from './reviews.mapper.js';

const POPULATE = { path: 'clientId', select: 'name' } as const;

/** Always recomputed from the Review collection (source of truth), never incremented in place. */
async function recomputeServiceRating(serviceId: string): Promise<void> {
  const reviews = await Review.find({ serviceId }).select('rating');
  const count = reviews.length;
  const avgRating = count > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : null;
  await Service.updateOne({ _id: serviceId }, { avgRating, reviewCount: count });
}

export async function createReview(client: AuthUser, bookingId: string, input: CreateReviewInput) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.clientId.toString() !== client.id) {
    throw AppError.forbidden('You can only review your own bookings');
  }
  if (booking.status !== 'completed') {
    throw AppError.badRequest('You can only review a booking after it is completed', 'BOOKING_NOT_COMPLETED');
  }
  const serviceItem = booking.services.find((s) => s.serviceId.toString() === input.serviceId);
  if (!serviceItem) {
    throw AppError.badRequest('That service was not part of this booking', 'SERVICE_NOT_IN_BOOKING');
  }
  const service = await Service.findById(input.serviceId).select('vendorId');
  if (!service?.vendorId) {
    throw AppError.badRequest('This service has no vendor to review', 'NO_VENDOR_TO_REVIEW');
  }

  let doc;
  try {
    doc = await Review.create({
      bookingId,
      clientId: client.id,
      vendorId: service.vendorId,
      serviceId: input.serviceId,
      rating: input.rating,
      comment: input.comment ?? null,
    });
  } catch (err) {
    // Unique index on {bookingId, serviceId} - a second review attempt for
    // the same service on the same booking hits this instead of a 500.
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      throw AppError.conflict('You already reviewed this service for this booking', 'ALREADY_REVIEWED');
    }
    throw err;
  }
  await doc.populate(POPULATE);
  await recomputeServiceRating(input.serviceId);
  return toReviewDto(doc);
}

export async function listForBooking(bookingId: string, viewer: AuthUser) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  await assertCanView(booking, viewer);

  const docs = await Review.find({ bookingId }).populate(POPULATE).sort({ createdAt: -1 });
  return docs.map(toReviewDto);
}

export async function listForService(serviceId: string, query: PaginationQuery) {
  const skip = (query.page - 1) * query.limit;
  const [docs, total] = await Promise.all([
    Review.find({ serviceId }).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Review.countDocuments({ serviceId }),
  ]);
  return buildPaginatedResult(docs.map(toReviewDto), total, query.page, query.limit);
}
