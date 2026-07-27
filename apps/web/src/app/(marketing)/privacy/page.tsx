import type { Metadata } from 'next';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Shatha Events collects, uses, and protects your information.',
};

const SECTIONS = [
  {
    title: '1. Information we collect',
    body: `When you create an account, we collect your name, email address, and password (stored only as a salted bcrypt hash — we never store or can see your actual password). You may optionally add a phone number and profile photo. When you submit a booking, we collect the event details you provide (event type, date, guest count, budget, and any message to the vendor). When you send a message through our contact form, we collect your name, email, and the message itself.`,
  },
  {
    title: '2. How we use it',
    body: `We use this information to operate your account, process booking requests between clients and vendors, send transactional emails (verification codes, password resets, booking status updates), and respond to messages sent through the contact form. We don't sell your personal information.`,
  },
  {
    title: '3. Cookies and sessions',
    body: `We use a small number of cookies required for the platform to function: an httpOnly cookie that keeps you signed in (never readable by page scripts), and a non-sensitive cookie that only indicates whether a session is present, used to decide which pages to show. We don't use third-party advertising or tracking cookies.`,
  },
  {
    title: '4. Third-party services',
    body: `We use a transactional email provider to deliver verification codes, password resets, and notifications, and — if you upload images — an image hosting provider to store them. These providers only receive the minimum information needed to perform that specific function (e.g., your email address and the message content, or the image file itself).`,
  },
  {
    title: '5. Data retention',
    body: `We retain your account information for as long as your account is active. If you'd like your account and associated data deleted, contact us at hello@shathaevents.com and we'll process the request.`,
  },
  {
    title: '6. Your choices',
    body: `You can review and update your name, phone number, avatar, and notification preferences at any time from your account settings. You can also request a copy of the data we hold about you, or ask us to correct or delete it, by contacting us.`,
  },
  {
    title: '7. Security',
    body: `Passwords are hashed with bcrypt and never stored in plain text. Password-reset and email-verification codes are stored as one-way hashes and expire automatically. We use HTTPS in production and rate-limit sensitive endpoints to reduce the risk of automated abuse.`,
  },
  {
    title: '8. Children',
    body: `Shatha Events is not directed at children, and we don't knowingly collect information from anyone under 18.`,
  },
  {
    title: '9. Changes',
    body: `We may update this policy from time to time; the "last updated" date above will reflect the most recent revision.`,
  },
  {
    title: '10. Contact',
    body: `Questions about this policy, or requests about your data, can be sent to hello@shathaevents.com or through our contact page.`,
  },
];

export default function PrivacyPage() {
  return (
    <section className="section-ivory">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-ink-soft">Last updated July 2026.</p>

          <div className="mt-10 space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-lg font-semibold text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{section.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
