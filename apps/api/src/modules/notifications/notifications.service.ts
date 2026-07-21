import type { NotificationListQuery, NotificationType } from '@app/shared';
import { Notification } from '../../models/Notification.js';
import { AppError } from '../../lib/app-error.js';
import { buildPaginatedResult } from '../../lib/pagination.js';
import { emitToUser } from '../../socket.js';
import { toNotificationDto } from './notifications.mapper.js';

export async function listNotifications(userId: string, query: NotificationListQuery) {
  const filter: Record<string, unknown> = { userId };
  if (query.unreadOnly) filter.isRead = false;

  const skip = (query.page - 1) * query.limit;
  const [docs, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Notification.countDocuments(filter),
  ]);
  return buildPaginatedResult(docs.map(toNotificationDto), total, query.page, query.limit);
}

export async function markRead(userId: string, notificationId: string) {
  const doc = await Notification.findOne({ _id: notificationId, userId });
  if (!doc) throw AppError.notFound('Notification not found');
  doc.isRead = true;
  await doc.save();
  return toNotificationDto(doc);
}

export async function markAllRead(userId: string): Promise<void> {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

export async function unreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, isRead: false });
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  relatedBookingId?: string | null;
}

/**
 * Internal helper (not exposed as a route) used by bookings/tasks services
 * whenever something happens that a user should hear about. Persists the
 * notification and pushes it live over that user's socket room, in the
 * exact shape apps/web's socket-client.ts expects under "notification:new".
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const doc = await Notification.create({
    userId: params.userId,
    type: params.type,
    message: params.message,
    relatedBookingId: params.relatedBookingId ?? null,
  });
  emitToUser(params.userId, 'notification:new', { notification: toNotificationDto(doc) });
}
