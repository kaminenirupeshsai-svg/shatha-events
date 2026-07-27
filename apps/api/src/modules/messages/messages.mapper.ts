import type { MessageDto } from '@app/shared';
import type { MessageDoc } from '../../models/Message.js';

interface MaybePopulatedUser {
  _id: { toString(): string };
  name?: string;
  role?: string;
}

export function toMessageDto(doc: MessageDoc): MessageDto {
  const sender = doc.senderId as unknown as MaybePopulatedUser;
  const populated = Boolean(sender && typeof sender === 'object' && 'name' in sender);
  return {
    id: doc._id.toString(),
    bookingId: doc.bookingId.toString(),
    vendorId: doc.vendorId.toString(),
    senderId: sender._id.toString(),
    senderName: populated ? (sender.name ?? '') : '',
    // Safe cast: only 'client'/'vendor' roles can ever POST a message (see
    // messages.routes.ts's requireRole), so the populated User.role here is
    // never really 'admin' in practice.
    senderRole: (populated ? sender.role : undefined) as MessageDto['senderRole'],
    body: doc.body,
    createdAt: (doc.createdAt as unknown as Date).toISOString(),
  };
}
