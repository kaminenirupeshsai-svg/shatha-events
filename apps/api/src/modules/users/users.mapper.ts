import type { UserDto, UserRole } from '@app/shared';
import type { UserDoc } from '../../models/User.js';

/** The one place a UserDoc (which may carry select:false secrets if explicitly requested) becomes the public UserDto. */
export function toUserDto(user: UserDoc): UserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    theme: (user.theme ?? 'system') as UserDto['theme'],
    notifyEmail: user.notifyEmail ?? true,
    createdAt: (user.createdAt as unknown as Date).toISOString(),
  };
}
