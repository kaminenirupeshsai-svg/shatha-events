import {
  BOOKING_STATUS_TRANSITIONS,
  type BookingListQuery,
  type CreateBookingInput,
  type UpdateBookingStatusInput,
} from '@app/shared';
import { Booking } from '../../models/Booking.js';
import type { BookingDoc } from '../../models/Booking.js';
import { Service } from '../../models/Service.js';
import type { ServiceDoc } from '../../models/Service.js';
import { User } from '../../models/User.js';
import { AppError } from '../../lib/app-error.js';
import { buildPaginatedResult, escapeRegex } from '../../lib/pagination.js';
import { emailService } from '../../lib/email.service.js';
import { logger } from '../../lib/logger.js';
import { emitToUser } from '../../socket.js';
import type { AuthUser } from '../../middleware/auth.js';
import { createNotification } from '../notifications/notifications.service.js';
import { toBookingDto } from './bookings.mapper.js';

const POPULATE = [
  { path: 'clientId', select: 'name' },
  { path: 'assignedAdminId', select: 'name' },
];

const SORT_MAP: Record<BookingListQuery['sort'], Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  event_date: { eventDate: 1 },
};

async function findAndPopulate(id: string): Promise<BookingDoc> {
  const doc = await Booking.findById(id).populate(POPULATE);
  if (!doc) throw AppError.notFound('Booking not found');
  return doc;
}

/** Extracts a plain id string whether the ref field is populated (a {_id, ...} doc) or a bare ObjectId. */
function idOf(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    return String((value as { _id: { toString(): string } })._id);
  }
  return String(value);
}

// A vendor is only genuinely committed to a date once a booking has been
// confirmed (or is already underway) - 'pending'/'reviewed' are still just
// requests under admin review, and multiple clients are allowed to inquire
// about the same date until one is actually confirmed. Compared by calendar
// day (UTC), not exact timestamp, since a vendor can't realistically serve
// two full events on the same day regardless of the time each was booked for.
async function assertNoVendorDoubleBooking(eventDate: Date, serviceDocs: ServiceDoc[]): Promise<void> {
  const vendorIds = [...new Set(serviceDocs.map((s) => s.vendorId).filter(Boolean).map((id) => id!.toString()))];
  if (vendorIds.length === 0) return;

  const vendorServices = await Service.find({ vendorId: { $in: vendorIds } }).select('_id vendorId');
  const vendorIdByServiceId = new Map(vendorServices.map((s) => [s._id.toString(), s.vendorId!.toString()]));

  const dayStart = new Date(eventDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const sameDayBookings = await Booking.find({
    status: { $in: ['confirmed', 'in_progress'] },
    eventDate: { $gte: dayStart, $lt: dayEnd },
    'services.serviceId': { $in: vendorServices.map((s) => s._id) },
  }).select('services');

  const conflictingVendorIds = new Set<string>();
  for (const booking of sameDayBookings) {
    for (const item of booking.services) {
      const vendorId = vendorIdByServiceId.get(item.serviceId.toString());
      if (vendorId && vendorIds.includes(vendorId)) conflictingVendorIds.add(vendorId);
    }
  }

  if (conflictingVendorIds.size === 0) return;

  const conflictingVendors = await User.find({ _id: { $in: [...conflictingVendorIds] } }).select('name');
  const names = conflictingVendors.map((v) => v.name).join(', ');
  throw AppError.conflict(
    `${names} already ${conflictingVendors.length > 1 ? 'have' : 'has'} a confirmed booking on this date. Choose a different date or remove that vendor's service.`,
    'VENDOR_DATE_CONFLICT',
  );
}

export async function createBooking(client: AuthUser, input: CreateBookingInput) {
  const account = await User.findById(client.id).select('emailVerified');
  if (!account?.emailVerified) {
    throw AppError.forbidden('Please verify your email before submitting a booking request', 'EMAIL_NOT_VERIFIED');
  }

  const serviceIds = input.services.map((item) => item.serviceId);
  const serviceDocs = await Service.find({ _id: { $in: serviceIds }, isActive: true });
  if (serviceDocs.length !== new Set(serviceIds).size) {
    throw AppError.badRequest(
      'One or more selected services are no longer available',
      'INVALID_SERVICE_SELECTION',
    );
  }
  const titleById = new Map(serviceDocs.map((s) => [s._id.toString(), s.title]));

  await assertNoVendorDoubleBooking(input.eventDate, serviceDocs);

  const doc = await Booking.create({
    clientId: client.id,
    eventType: input.eventType,
    eventDate: input.eventDate,
    guestCount: input.guestCount,
    services: input.services.map((item) => ({
      serviceId: item.serviceId,
      title: titleById.get(item.serviceId),
      notes: item.notes ?? null,
    })),
    budget: input.budget ?? null,
    message: input.message ?? null,
    status: 'pending',
    statusHistory: [{ status: 'pending', changedAt: new Date(), note: null }],
  });
  await doc.populate(POPULATE);

  // Fire-and-forget-ish: every admin gets an in-app + realtime notification
  // about the new booking. Failures here must never fail the booking itself.
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id.toString(),
          type: 'new_booking',
          message: `New booking request from a client for a ${input.eventType} event`,
          relatedBookingId: doc._id.toString(),
        }),
      ),
    );
  } catch (err) {
    logger.error({ err }, 'Failed to notify admins of new booking');
  }

  return toBookingDto(doc);
}

export async function listMyBookings(clientId: string, query: BookingListQuery) {
  const filter = buildSearchFilter({ clientId }, query);
  return listWithFilter(filter, query);
}

export async function listVendorBookings(vendor: AuthUser, query: BookingListQuery) {
  const services = await Service.find({ vendorId: vendor.id }).select('_id');
  const serviceIds = services.map((s) => s._id);
  const filter = buildSearchFilter({ 'services.serviceId': { $in: serviceIds } }, query);
  return listWithFilter(filter, query);
}

export async function listAllBookings(query: BookingListQuery) {
  const filter = buildSearchFilter({}, query);
  return listWithFilter(filter, query);
}

function buildSearchFilter(base: Record<string, unknown>, query: BookingListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...base };
  if (query.status) filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { eventType: { $regex: escapeRegex(query.q), $options: 'i' } },
      { message: { $regex: escapeRegex(query.q), $options: 'i' } },
      { 'services.title': { $regex: escapeRegex(query.q), $options: 'i' } },
    ];
  }
  return filter;
}

async function listWithFilter(filter: Record<string, unknown>, query: BookingListQuery) {
  const skip = (query.page - 1) * query.limit;
  const [docs, total] = await Promise.all([
    Booking.find(filter).populate(POPULATE).sort(SORT_MAP[query.sort]).skip(skip).limit(query.limit),
    Booking.countDocuments(filter),
  ]);
  return buildPaginatedResult(docs.map(toBookingDto), total, query.page, query.limit);
}

// Exported for reuse by reviews.service.ts - a review thread on a booking is
// visible to exactly whoever can view the booking itself (client who booked,
// vendor with a service on it, or admin), so this is the one place that rule lives.
export async function assertCanView(doc: BookingDoc, viewer: AuthUser): Promise<void> {
  if (viewer.role === 'admin') return;
  if (viewer.role === 'client') {
    if (idOf(doc.clientId) !== viewer.id) throw AppError.forbidden('Not your booking');
    return;
  }
  // vendor: only if one of their services is on the booking
  const services = await Service.find({ vendorId: viewer.id }).select('_id');
  const ownedIds = new Set(services.map((s) => s._id.toString()));
  const included = doc.services.some((item) => ownedIds.has(item.serviceId.toString()));
  if (!included) throw AppError.forbidden('Not one of your bookings');
}

export async function getBookingById(id: string, viewer: AuthUser) {
  const doc = await findAndPopulate(id);
  await assertCanView(doc, viewer);
  return toBookingDto(doc);
}

export async function updateStatus(id: string, viewer: AuthUser, input: UpdateBookingStatusInput) {
  const doc = await Booking.findById(id).populate(POPULATE);
  if (!doc) throw AppError.notFound('Booking not found');

  const currentStatus = doc.status as keyof typeof BOOKING_STATUS_TRANSITIONS;
  const allowed = BOOKING_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (viewer.role === 'admin') {
    if (!allowed.includes(input.status)) {
      throw AppError.badRequest(
        `Cannot move a booking from "${currentStatus}" to "${input.status}"`,
        'INVALID_STATUS_TRANSITION',
      );
    }
    if (!doc.assignedAdminId) {
      doc.assignedAdminId = viewer.id as unknown as typeof doc.assignedAdminId;
    }
  } else if (viewer.role === 'client') {
    if (idOf(doc.clientId) !== viewer.id) {
      throw AppError.forbidden('Not your booking');
    }
    if (input.status !== 'cancelled' || !allowed.includes('cancelled')) {
      throw AppError.badRequest('Clients may only cancel a booking that has not yet started', 'INVALID_STATUS_TRANSITION');
    }
  } else {
    throw AppError.forbidden('Vendors cannot change a booking status');
  }

  doc.status = input.status;
  doc.statusHistory.push({ status: input.status, changedAt: new Date(), note: input.note ?? null });
  await doc.save();
  await doc.populate(POPULATE);

  await notifyStatusChange(doc, viewer);

  return toBookingDto(doc);
}

async function notifyStatusChange(doc: BookingDoc, actor: AuthUser): Promise<void> {
  const clientId = idOf(doc.clientId);
  emitToUser(clientId, 'booking:status-changed', { bookingId: doc._id.toString(), status: doc.status });

  // Don't notify the client about their own action (e.g. self-cancellation).
  if (actor.id === clientId) return;

  try {
    await createNotification({
      userId: clientId,
      type: 'booking_status_changed',
      message: `Your booking is now "${String(doc.status).replace('_', ' ')}"`,
      relatedBookingId: doc._id.toString(),
    });

    const client = await User.findById(clientId).select('email name notifyEmail');
    if (client?.notifyEmail) {
      await emailService.send({
        to: client.email,
        subject: 'Your Shatha Events booking status has changed',
        body: `Hi ${client.name},\n\nYour booking for a ${doc.eventType} event is now "${String(doc.status).replace('_', ' ')}".\n\nYou can view the full details in your dashboard.`,
      });
    }
  } catch (err) {
    logger.error({ err }, 'Failed to notify client of booking status change');
  }
}
