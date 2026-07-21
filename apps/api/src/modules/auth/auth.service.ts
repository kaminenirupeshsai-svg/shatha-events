import bcrypt from 'bcrypt';
import type { LoginInput, SignupInput, UserRole } from '@app/shared';
import { User } from '../../models/User.js';
import type { UserDoc } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { AppError } from '../../lib/app-error.js';
import { signAccessToken, accessTokenExpiryDate } from '../../lib/jwt.js';
import { generateRawToken, hashToken } from '../../lib/tokens.js';
import { env } from '../../config/env.js';
import { emailService } from '../../lib/email.service.js';
import { logger } from '../../lib/logger.js';
import { toUserDto } from '../users/users.mapper.js';

const BCRYPT_ROUNDS = 12;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

interface AuthResult {
  user: ReturnType<typeof toUserDto>;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenRaw: string;
}

async function issueTokens(user: UserDoc): Promise<AuthResult> {
  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role as UserRole });
  const refreshTokenRaw = generateRawToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId: user._id, tokenHash: hashToken(refreshTokenRaw), expiresAt });
  return {
    user: toUserDto(user),
    accessToken,
    accessTokenExpiresAt: accessTokenExpiryDate().toISOString(),
    refreshTokenRaw,
  };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw AppError.conflict('An account with that email already exists', 'EMAIL_TAKEN');
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });
  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    throw AppError.unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  }
  return issueTokens(user);
}

export async function refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
  if (!rawRefreshToken) {
    throw AppError.unauthorized('Missing refresh token', 'MISSING_REFRESH_TOKEN');
  }
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized('Your session has expired, please sign in again', 'INVALID_REFRESH_TOKEN');
  }
  const user = await User.findById(stored.userId);
  if (!user) {
    throw AppError.unauthorized('Your session has expired, please sign in again', 'INVALID_REFRESH_TOKEN');
  }
  // Rotate: the presented token is single-use.
  stored.revokedAt = new Date();
  await stored.save();
  return issueTokens(user);
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}

/** Always resolves without revealing whether the address is registered. */
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return;

  const rawToken = generateRawToken();
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
  try {
    await emailService.send({
      to: user.email,
      subject: 'Reset your Shatha Events password',
      body: `Hi ${user.name},\n\nUse the link below to reset your password. It expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    });
  } catch (err) {
    // Never let an email-provider outage surface to the client as a failure
    // (that would leak whether the address exists), but do log it.
    logger.error({ err }, 'Failed to send password reset email');
  }
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const user = await User.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt',
  );
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    throw AppError.badRequest('That reset link is invalid or has expired', 'INVALID_RESET_TOKEN');
  }
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
  // A password reset invalidates every existing session, not just the current one.
  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
}
