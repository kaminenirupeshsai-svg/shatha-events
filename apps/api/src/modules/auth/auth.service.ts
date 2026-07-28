import bcrypt from 'bcrypt';
import type { LoginInput, SignupInput, UserRole } from '@app/shared';
import { User } from '../../models/User.js';
import type { UserDoc } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { AppError } from '../../lib/app-error.js';
import { signAccessToken, accessTokenExpiryDate } from '../../lib/jwt.js';
import { generateOtp, generateRawToken, hashToken } from '../../lib/tokens.js';
import { env } from '../../config/env.js';
import { emailService } from '../../lib/email.service.js';
import { logger } from '../../lib/logger.js';
import { toUserDto } from '../users/users.mapper.js';

const BCRYPT_ROUNDS = 12;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes - short-lived, unlike the old link (entered by hand right after signup)
const MAX_EMAIL_OTP_ATTEMPTS = 5; // wrong-code guesses before the code is invalidated and a resend is required

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

/**
 * Generates a fresh 6-digit code, persists its hash + expiry on the user
 * (resetting the wrong-guess counter), and emails the plain code. Shared by
 * signup() and resendVerification() so there's exactly one place that does
 * this. Never throws on an email-provider failure - same defensive shape as
 * forgotPassword's send below - a mail outage must never break signup itself.
 */
async function sendVerificationEmail(user: UserDoc): Promise<void> {
  const otp = generateOtp();
  user.emailVerificationOtpHash = hashToken(otp);
  user.emailVerificationOtpExpiresAt = new Date(Date.now() + EMAIL_OTP_TTL_MS);
  user.emailVerificationAttempts = 0;
  await user.save();

  try {
    await emailService.send({
      to: user.email,
      subject: 'Your Shatha Events verification code',
      body: `Hi ${user.name},\n\nYour verification code is: ${otp}\n\nEnter this on the verification screen to confirm your email. It expires in 10 minutes.\n\nIf you didn't create this account, you can safely ignore this email.`,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send verification email');
  }
}

interface SignupResult {
  message: string;
  email: string;
}

export async function signup(input: SignupInput): Promise<SignupResult> {
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
    // New vendor accounts require admin approval before they can list
    // services - see the gate in services.service.ts createService().
    vendorStatus: input.role === 'vendor' ? 'pending' : 'approved',
    // Must confirm the address before logging in at all - see login() below.
    emailVerified: false,
  });
  await sendVerificationEmail(user);
  // No session is issued here - login() requires emailVerified, and this
  // account isn't yet, so there's nothing valid to log them into.
  return { message: 'Account created — check your email to verify it before signing in.', email: user.email };
}

export async function verifyEmail(email: string, otp: string): Promise<void> {
  const user = await User.findOne({ email }).select(
    '+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationAttempts',
  );
  if (!user || user.emailVerified) {
    throw AppError.badRequest('That code is invalid or has expired', 'INVALID_VERIFICATION_CODE');
  }
  // Checked before looking at the code itself, so once the limit is hit every
  // further attempt gets this specific message consistently (not the generic
  // "invalid or expired" one) until a resend issues a fresh code and counter.
  if (user.emailVerificationAttempts >= MAX_EMAIL_OTP_ATTEMPTS) {
    throw AppError.badRequest('Too many incorrect attempts. Request a new code.', 'TOO_MANY_VERIFICATION_ATTEMPTS');
  }
  if (
    !user.emailVerificationOtpHash ||
    !user.emailVerificationOtpExpiresAt ||
    user.emailVerificationOtpExpiresAt.getTime() < Date.now()
  ) {
    throw AppError.badRequest('That code is invalid or has expired', 'INVALID_VERIFICATION_CODE');
  }
  if (hashToken(otp) !== user.emailVerificationOtpHash) {
    user.emailVerificationAttempts += 1;
    await user.save();
    throw AppError.badRequest('That code is incorrect', 'INVALID_VERIFICATION_CODE');
  }
  user.emailVerified = true;
  user.emailVerificationOtpHash = null;
  user.emailVerificationOtpExpiresAt = null;
  user.emailVerificationAttempts = 0;
  await user.save();
}

/** Always resolves without revealing whether the address is registered or already verified. */
export async function resendVerification(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.emailVerified) return;
  await sendVerificationEmail(user);
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
  // Checked only after the password is confirmed correct, so probing random
  // emails never reveals whether an account has been deactivated.
  if (user.isActive === false) {
    throw AppError.forbidden(
      'This account has been deactivated. Contact support if you believe this is a mistake.',
      'ACCOUNT_DEACTIVATED',
    );
  }
  if (!user.emailVerified) {
    throw AppError.forbidden(
      'Please verify your email before logging in — check your inbox for the code we sent when you signed up.',
      'EMAIL_NOT_VERIFIED',
    );
  }
  return issueTokens(user);
}

export async function refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
  if (!rawRefreshToken) {
    throw AppError.unauthorized('Missing refresh token', 'MISSING_REFRESH_TOKEN');
  }
  const tokenHash = hashToken(rawRefreshToken);
  // Atomic find-and-revoke: two concurrent requests presenting the same raw
  // token (e.g. a replayed/stolen cookie racing the legitimate client) must
  // not both be able to observe it as "not yet revoked" - only the request
  // whose update actually flips revokedAt may proceed to issue new tokens.
  const stored = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() },
  );
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized('Your session has expired, please sign in again', 'INVALID_REFRESH_TOKEN');
  }
  const user = await User.findById(stored.userId);
  if (!user) {
    throw AppError.unauthorized('Your session has expired, please sign in again', 'INVALID_REFRESH_TOKEN');
  }
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
