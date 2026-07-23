import type { UserDto, UserRole, VendorDirectoryDto } from '@app/shared';
import type { UserDoc } from '../../models/User.js';

/** The one place a UserDoc (which may carry select:false secrets if explicitly requested) becomes the public UserDto. */
export function toUserDto(user: UserDoc): UserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    vendorStatus: (user.vendorStatus ?? 'approved') as UserDto['vendorStatus'],
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    theme: (user.theme ?? 'system') as UserDto['theme'],
    notifyEmail: user.notifyEmail ?? true,
    createdAt: (user.createdAt as unknown as Date).toISOString(),
  };
}

/**
 * The public vendor-directory shape (GET /api/users?role=vendor is open to
 * any signed-in user, not just admins) - deliberately excludes email/phone,
 * which toUserDto always includes and which a browsing client/vendor has no
 * business seeing for someone else's account.
 */
export function toVendorDirectoryDto(user: UserDoc): VendorDirectoryDto {
  return {
    id: user._id.toString(),
    name: user.name,
    role: user.role as UserRole,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: (user.createdAt as unknown as Date).toISOString(),
  };
}
