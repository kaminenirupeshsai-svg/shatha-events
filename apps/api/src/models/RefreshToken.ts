import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type RefreshTokenDoc = HydratedDocument<InferSchemaType<typeof RefreshTokenSchema>>;

export const RefreshToken = model('RefreshToken', RefreshTokenSchema);
