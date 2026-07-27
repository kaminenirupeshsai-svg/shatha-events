import { z } from 'zod';
import { MongoIdSchema } from './common.schema.js';

export const CreateMessageInputSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});
export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>;

export const MessageDtoSchema = z.object({
  id: MongoIdSchema,
  bookingId: MongoIdSchema,
  vendorId: MongoIdSchema,
  senderId: MongoIdSchema,
  senderName: z.string(),
  senderRole: z.enum(['client', 'vendor']),
  body: z.string(),
  createdAt: z.string(),
});
export type MessageDto = z.infer<typeof MessageDtoSchema>;
