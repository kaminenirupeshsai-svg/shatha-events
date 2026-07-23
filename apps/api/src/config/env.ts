import 'dotenv/config';
import { z } from 'zod';

// Every process.env access in the codebase should go through this module.
// We fail fast and loud at startup rather than crashing mysteriously later
// when e.g. JWT_ACCESS_SECRET turns out to be undefined mid-request.
const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  EMAIL_DRIVER: z.enum(['console', 'resend', 'gmail']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  GMAIL_USER: z.string().email().optional(),
  // Not your real Gmail password - a 16-character Google "App Password"
  // (myaccount.google.com/apppasswords, requires 2-Step Verification).
  GMAIL_APP_PASSWORD: z.string().optional(),
  // Where the public Contact page's messages get delivered. Defaults to
  // GMAIL_USER (send to the same inbox already configured for outbound
  // mail) if unset - see contact.service.ts.
  CONTACT_EMAIL: z.string().email().optional(),
});

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof EnvSchema>;
