import type { ContactInput } from '@app/shared';
import { env } from '../../config/env.js';
import { emailService } from '../../lib/email.service.js';
import { logger } from '../../lib/logger.js';

/**
 * Delivers the public Contact page's messages to a real inbox instead of
 * discarding them. Reuses the same emailService every other transactional
 * message in this app goes through (console driver logs it if no real
 * provider is configured yet - same graceful-degradation as password reset
 * and email verification).
 */
export async function sendContactMessage(input: ContactInput): Promise<void> {
  const to = env.CONTACT_EMAIL ?? env.GMAIL_USER ?? 'hello@shathaevents.com';
  try {
    await emailService.send({
      to,
      subject: `New contact message from ${input.name}`,
      body: `From: ${input.name} <${input.email}>\n\n${input.message}`,
    });
  } catch (err) {
    // The submitter still sees a success response (see controller) - the
    // message wasn't lost from their perspective; but a delivery failure on
    // our end must be visible in the logs, not swallowed silently.
    logger.error({ err }, 'Failed to deliver contact message');
    throw err;
  }
}
