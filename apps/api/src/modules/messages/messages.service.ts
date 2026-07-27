import type { CreateMessageInput } from '@app/shared';
import { Message } from '../../models/Message.js';
import { Booking } from '../../models/Booking.js';
import type { BookingDoc } from '../../models/Booking.js';
import { AppError } from '../../lib/app-error.js';
import { logger } from '../../lib/logger.js';
import { emitToUser } from '../../socket.js';
import type { AuthUser } from '../../middleware/auth.js';
import { createNotification } from '../notifications/notifications.service.js';
import { toMessageDto } from './messages.mapper.js';

const POPULATE = { path: 'senderId', select: 'name role' } as const;

/**
 * One thread per (booking, vendor) - a multi-vendor booking gets a separate
 * private conversation per vendor rather than one shared thread everyone on
 * the booking can read. Same "who can see this" shape as reviews/tasks:
 * admin sees everything, the client sees any vendor actually on their
 * booking, a vendor sees only their own thread.
 */
async function assertThreadAccess(booking: BookingDoc, vendorId: string, viewer: AuthUser): Promise<void> {
  if (viewer.role === 'admin') return;
  const hasVendorOnBooking = booking.services.some((s) => s.vendorId?.toString() === vendorId);
  if (viewer.role === 'client') {
    if (booking.clientId.toString() !== viewer.id) throw AppError.forbidden('Not your booking');
    if (!hasVendorOnBooking) throw AppError.badRequest('That vendor is not on this booking', 'VENDOR_NOT_ON_BOOKING');
    return;
  }
  // vendor
  if (viewer.id !== vendorId || !hasVendorOnBooking) {
    throw AppError.forbidden('Not your conversation');
  }
}

export async function listThread(bookingId: string, vendorId: string, viewer: AuthUser) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  await assertThreadAccess(booking, vendorId, viewer);

  const docs = await Message.find({ bookingId, vendorId }).populate(POPULATE).sort({ createdAt: 1 });
  return docs.map(toMessageDto);
}

export async function sendMessage(bookingId: string, vendorId: string, sender: AuthUser, input: CreateMessageInput) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  await assertThreadAccess(booking, vendorId, sender);

  const doc = await Message.create({ bookingId, vendorId, senderId: sender.id, body: input.body });
  await doc.populate(POPULATE);

  const recipientId = sender.role === 'client' ? vendorId : booking.clientId.toString();
  emitToUser(recipientId, 'message:new', { bookingId, vendorId });
  try {
    await createNotification({
      userId: recipientId,
      type: 'message_received',
      message: 'You have a new message about a booking',
      relatedBookingId: bookingId,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to notify recipient of new message');
  }

  return toMessageDto(doc);
}
