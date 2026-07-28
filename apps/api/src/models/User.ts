import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['client', 'vendor', 'admin'], required: true },
    // Only meaningful for role: 'vendor' - defaults to 'approved' so it's a
    // no-op for client/admin accounts. signup() explicitly overrides this to
    // 'pending' for new vendor signups; see auth.service.ts.
    vendorStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    phone: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifyEmail: { type: Boolean, default: true },
    // Admin-controlled deactivation (see users.service.ts setUserActive) -
    // blocks login and revokes existing sessions, but never deletes the
    // account or anything it's connected to (bookings/reviews/messages keep
    // showing this user's name correctly for whoever else was involved).
    isActive: { type: Boolean, default: true },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    // Defaults true so every account that already exists is unaffected -
    // signup() explicitly overrides this to false for every new signup.
    // See the gates in services.service.ts createService and
    // bookings.service.ts createBooking.
    emailVerified: { type: Boolean, default: true },
    emailVerificationOtpHash: { type: String, default: null, select: false },
    emailVerificationOtpExpiresAt: { type: Date, default: null, select: false },
    // Wrong-code guesses against the current OTP; reset on every resend and
    // on a successful verify. Capped in auth.service.ts to blunt brute-forcing
    // a 6-digit (1-in-a-million) code beyond what the IP rate limiter alone would.
    emailVerificationAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof UserSchema>>;

export const User = model('User', UserSchema);
