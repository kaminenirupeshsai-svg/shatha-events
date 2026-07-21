import type { NotificationDto } from '@app/shared';
import type { NotificationDoc } from '../../models/Notification.js';

export function toNotificationDto(doc: NotificationDoc): NotificationDto {
  return {
    id: doc._id.toString(),
    type: doc.type as NotificationDto['type'],
    message: doc.message,
    relatedBookingId: doc.relatedBookingId ? doc.relatedBookingId.toString() : null,
    isRead: doc.isRead,
    createdAt: (doc.createdAt as unknown as Date).toISOString(),
  };
}
