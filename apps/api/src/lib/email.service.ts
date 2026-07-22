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

/**
 * Gmail SMTP driver via Nodemailer, authenticated with a Google "App
 * Password" (myaccount.google.com/apppasswords) rather than the real
 * account password - the account password won't work here since Google
 * requires 2-Step Verification + an app password for SMTP access. The
 * transporter is created lazily and reused across sends.
 */
class GmailEmailService implements EmailService {
  private transporterPromise: ReturnType<GmailEmailService['createTransporter']> | null = null;

  private async createTransporter() {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      throw new Error('EMAIL_DRIVER=gmail requires GMAIL_USER and GMAIL_APP_PASSWORD to be set');
    }
    const nodemailer = await import('nodemailer');
    return nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.transporterPromise) {
      this.transporterPromise = this.createTransporter();
    }
    const transporter = await this.transporterPromise;
    try {
      await transporter.sendMail({
        from: `Shatha Events <${env.GMAIL_USER}>`,
        to: message.to,
        subject: message.subject,
        text: message.body,
      });
      logger.info({ to: message.to }, 'Email sent via Gmail');
    } catch (err) {
      logger.error({ err, to: message.to }, 'Gmail email send failed');
      throw err;
    }
  }
}

function createEmailService(): EmailService {
  if (env.EMAIL_DRIVER === 'resend') {
    return new ResendEmailService();
  }
  if (env.EMAIL_DRIVER === 'gmail') {
    return new GmailEmailService();
  }
  return new ConsoleEmailService();
}

export const emailService: EmailService = createEmailService();
