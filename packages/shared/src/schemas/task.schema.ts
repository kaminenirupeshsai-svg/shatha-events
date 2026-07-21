import { z } from 'zod';
import { MongoIdSchema } from './common.schema.js';

export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(200),
  assignedTo: MongoIdSchema,
  dueDate: z.coerce.date().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const UpdateTaskStatusInputSchema = z.object({
  status: TaskStatusSchema,
});
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusInputSchema>;

export const TaskDtoSchema = z.object({
  id: MongoIdSchema,
  bookingId: MongoIdSchema,
  title: z.string(),
  assignedTo: MongoIdSchema,
  assignedToName: z.string(),
  dueDate: z.string().nullable(),
  status: TaskStatusSchema,
  createdAt: z.string(),
});
export type TaskDto = z.infer<typeof TaskDtoSchema>;
