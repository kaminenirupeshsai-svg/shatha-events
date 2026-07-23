import type { TaskDto } from '@app/shared';
import type { TaskDoc } from '../../models/Task.js';

interface MaybePopulatedUser {
  _id: { toString(): string };
  name?: string;
}

export function toTaskDto(doc: TaskDoc): TaskDto {
  const assignee = doc.assignedTo as unknown as MaybePopulatedUser | null;
  const populated = Boolean(assignee && typeof assignee === 'object' && 'name' in assignee);
  return {
    id: doc._id.toString(),
    bookingId: doc.bookingId.toString(),
    title: doc.title,
    assignedTo: assignee ? String(assignee._id) : '',
    assignedToName: populated ? (assignee?.name ?? '') : '',
    dueDate: doc.dueDate ? (doc.dueDate as unknown as Date).toISOString() : null,
    status: doc.status as TaskDto['status'],
    createdAt: (doc.createdAt as unknown as Date).toISOString(),
  };
}
