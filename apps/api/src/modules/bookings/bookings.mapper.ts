import type { BookingDto } from '@app/shared';
import type { BookingDoc } from '../../models/Booking.js';

interface MaybePopulatedUser {
  _id: { toString(): string };
  name?: string;
}

export function toBookingDto(doc: BookingDoc): BookingDto {
  const client = doc.clientId as unknown as MaybePopulatedUser;
  const admin = doc.assignedAdminId as unknown as MaybePopulatedUser | null;
  const clientPopulated = Boolean(client && typeof client === 'object' && 'name' in client);
  const adminPopulated = Boolean(admin && typeof admin === 'object' && 'name' in admin);

  return {
    id: doc._id.toString(),
    clientId: client._id.toString(),
    clientName: clientPopulated ? (client.name ?? '') : '',
    eventType: doc.eventType as BookingDto['eventType'],
    eventDate: (doc.eventDate as unknown as Date).toISOString(),
    guestCount: doc.guestCount,
    services: doc.services.map((item) => {
      const vendor = item.vendorId as unknown as MaybePopulatedUser | null;
      const vendorPopulated = Boolean(vendor && typeof vendor === 'object' && 'name' in vendor);
      return {
        serviceId: item.serviceId.toString(),
        title: item.title,
        notes: item.notes ?? null,
        vendorId: vendor ? vendor._id.toString() : null,
        vendorName: vendorPopulated ? (vendor?.name ?? null) : null,
      };
    }),
    budget: doc.budget ?? null,
    message: doc.message ?? null,
    status: doc.status as BookingDto['status'],
    assignedAdminId: admin ? admin._id.toString() : null,
    assignedAdminName: adminPopulated ? (admin?.name ?? null) : null,
    statusHistory: doc.statusHistory.map((entry) => ({
      status: entry.status as BookingDto['status'],
      changedAt: (entry.changedAt as unknown as Date).toISOString(),
      note: entry.note ?? null,
    })),
    createdAt: (doc.createdAt as unknown as Date).toISOString(),
  };
}
