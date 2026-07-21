import type { CreateTaskInput, TaskStatus } from '@app/shared';
import { Task } from '../../models/Task.js';
import { Booking } from '../../models/Booking.js';
import { AppError } from '../../lib/app-error.js';
import { logger } from '../../lib/logger.js';
import type { AuthUser } from '../../middleware/auth.js';
import { createNotification } from '../notifications/notifications.service.js';
import { toTaskDto } from './tasks.mapper.js';

const POPULATE = { path: 'assignedTo', select: 'name' } as const;

function idOf(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    return String((value as { _id: { toString(): string } })._id);
  }
  return String(value);
}

export async function createTask(bookingId: string, input: CreateTaskInput) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');

  const doc = await Task.create({
    bookingId,
    title: input.title,
    assignedTo: input.assignedTo,
    dueDate: input.dueDate ?? null,
  });
  await doc.populate(POPULATE);

  try {
    await createNotification({
      userId: input.assignedTo,
      type: 'task_assigned',
      message: `You've been assigned a new task: "${input.title}"`,
      relatedBookingId: bookingId,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to notify assignee of new task');
  }

  return toTaskDto(doc);
}

export async function listForBooking(bookingId: string) {
  const docs = await Task.find({ bookingId }).populate(POPULATE).sort({ createdAt: -1 });
  return docs.map(toTaskDto);
}

export async function listMine(userId: string) {
  const docs = await Task.find({ assignedTo: userId }).populate(POPULATE).sort({ createdAt: -1 });
  return docs.map(toTaskDto);
}

export async function updateStatus(taskId: string, viewer: AuthUser, status: TaskStatus) {
  const doc = await Task.findById(taskId).populate(POPULATE);
  if (!doc) throw AppError.notFound('Task not found');

  const assigneeId = idOf(doc.assignedTo);
  if (viewer.role !== 'admin' && assigneeId !== viewer.id) {
    throw AppError.forbidden('You can only update tasks assigned to you');
  }

  doc.status = status;
  await doc.save();
  return toTaskDto(doc);
}
