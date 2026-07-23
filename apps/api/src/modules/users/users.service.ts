import bcrypt from 'bcrypt';
import type {
  UpdatePasswordInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  UserRole,
  VendorStatus,
} from '@app/shared';
import { User } from '../../models/User.js';
import { AppError } from '../../lib/app-error.js';
import { buildPaginatedResult, escapeRegex, type PaginatedResult } from '../../lib/pagination.js';
import { createNotification } from '../notifications/notifications.service.js';
import { toUserDto } from './users.mapper.js';

const BCRYPT_ROUNDS = 12;

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return toUserDto(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone === '' ? null : input.phone;
  await user.save();
  return toUserDto(user);
}

export async function updatePassword(userId: string, input: UpdatePasswordInput): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw AppError.notFound('User not found');
  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw AppError.badRequest('Your current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }
  user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await user.save();
}

export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (input.theme !== undefined) user.theme = input.theme;
  if (input.notifyEmail !== undefined) user.notifyEmail = input.notifyEmail;
  await user.save();
  return toUserDto(user);
}

export async function setAvatar(userId: string, avatarUrl: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  user.avatarUrl = avatarUrl;
  await user.save();
  return toUserDto(user);
}

export interface ListUsersParams {
  page: number;
  limit: number;
  role?: UserRole;
  q?: string;
  vendorStatus?: VendorStatus;
}

/** Shared by both the admin listing and the public vendor-directory lookup - callers map the returned docs through whichever DTO fits (see users.controller.ts). */
export async function listUserDocs(params: ListUsersParams) {
  const filter: Record<string, unknown> = {};
  if (params.role) filter.role = params.role;
  if (params.vendorStatus) filter.vendorStatus = params.vendorStatus;
  if (params.q) {
    const regex = { $regex: escapeRegex(params.q), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (params.page - 1) * params.limit;
  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(params.limit),
    User.countDocuments(filter),
  ]);
  return { docs, total };
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResult<ReturnType<typeof toUserDto>>> {
  const { docs, total } = await listUserDocs(params);
  return buildPaginatedResult(docs.map(toUserDto), total, params.page, params.limit);
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return toUserDto(user);
}

export async function updateVendorStatus(userId: string, status: 'approved' | 'rejected') {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.role !== 'vendor') {
    throw AppError.badRequest('Only vendor accounts have an approval status', 'NOT_A_VENDOR');
  }
  user.vendorStatus = status;
  await user.save();

  const message =
    status === 'approved'
      ? 'Your vendor account has been approved - you can now list services.'
      : 'Your vendor account application was not approved.';
  await createNotification({ userId: user._id.toString(), type: 'vendor_status_changed', message });

  return toUserDto(user);
}
