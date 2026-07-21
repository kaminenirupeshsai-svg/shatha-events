import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', '..', '.email-log.txt');

/** Default driver: logs to console AND appends a record to apps/api/.email-log.txt. */
class ConsoleEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    const entry = `\n[${new Date().toISOString()}] To: ${message.to}\nSubject: ${message.subject}\n${message.body}\n${'-'.repeat(60)}\n`;
    logger.info({ to: message.to, subject: message.subject }, 'Email (console driver)');
    // eslint-disable-next-line no-console
    console.log(entry);
    try {
      fs.appendFileSync(LOG_FILE, entry, 'utf-8');
    } catch (err) {
      logger.warn({ err }, 'Could not write to .email-log.txt');
    }
  }
}

/**
 * Resend driver. Only ever instantiated/called when EMAIL_DRIVER=resend, and
 * even then it lazily imports the SDK so it's never a hard dependency of the
 * console-driver dev path. The exact request shape is intentionally kept
 * simple - swap in the real `resend` npm package's client if/when this goes
 * to production with a real API key.
 */
class ResendEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    if (!env.RESEND_API_KEY) {
      throw new Error('EMAIL_DRIVER=resend requires RESEND_API_KEY to be set');
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Shatha Events <notifications@shatha.example>',
        to: [message.to],
        subject: message.subject,
        text: message.body,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      logger.error({ status: response.status, text }, 'Resend email send failed');
      throw new Error(`Resend API error: ${response.status}`);
    }
    logger.info({ to: message.to }, 'Email sent via Resend');
  }
}

function createEmailService(): EmailService {
  if (env.EMAIL_DRIVER === 'resend') {
    return new ResendEmailService();
  }
  return new ConsoleEmailService();
}

export const emailService: EmailService = createEmailService();
