import { z } from 'zod';

export const ContactInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  message: z.string().trim().min(10, 'Add a bit more detail').max(4000),
});
export type ContactInput = z.infer<typeof ContactInputSchema>;
