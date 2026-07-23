import { z } from 'zod';
import { MongoIdSchema } from './common.schema.js';

export const UserRoleSchema = z.enum(['client', 'vendor', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const VendorStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const UserDtoSchema = z.object({
  id: MongoIdSchema,
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  vendorStatus: VendorStatusSchema,
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  theme: z.enum(['light', 'dark', 'system']),
  notifyEmail: z.boolean(),
  createdAt: z.string(),
});
export type UserDto = z.infer<typeof UserDtoSchema>;

// The public vendor-directory shape (GET /api/users?role=vendor, open to any
// signed-in user) - deliberately excludes email/phone. See users.mapper.ts.
export const VendorDirectoryDtoSchema = z.object({
  id: MongoIdSchema,
  name: z.string(),
  role: UserRoleSchema,
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type VendorDirectoryDto = z.infer<typeof VendorDirectoryDtoSchema>;

export const UpdateVendorStatusInputSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});
export type UpdateVendorStatusInput = z.infer<typeof UpdateVendorStatusInputSchema>;

export const UpdateProfileInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const UpdatePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordInputSchema>;

export const UpdateSettingsInputSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifyEmail: z.boolean().optional(),
});
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;
