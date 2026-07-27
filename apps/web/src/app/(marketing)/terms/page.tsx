import type { Metadata } from 'next';
import { Reveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern use of Shatha Events.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of these terms',
    body: `By creating an account or using Shatha Events, you agree to these Terms of Service. If you don't agree, please don't use the platform.`,
  },
  {
    title: '2. What Shatha Events is',
    body: `Shatha Events is a booking platform that connects clients planning events with vendors who offer event services (decor, catering, photography, venues, entertainment, and similar). We facilitate the booking request and status pipeline between clients, vendors, and our admin team — we are not a party to the underlying service agreement between a client and a vendor.`,
  },
  {
    title: '3. Accounts',
    body: `You must provide accurate information when creating an account, and you're responsible for keeping your login credentials confidential. Email addresses must be verified with the code we send before the account can create a booking or list a service. Vendor accounts additionally require admin approval before they can list services — we may decline or revoke this approval at our discretion, for example if a listing appears misleading or the vendor cannot be reasonably verified.`,
  },
  {
    title: '4. Bookings',
    body: `Submitting a booking request is not a guarantee that a vendor is available — our admin team reviews and updates each booking's status. Pricing, deposits, payment schedules, and cancellation terms for the underlying event service are agreed directly between the client and vendor; Shatha Events does not currently process payments on either party's behalf.`,
  },
  {
    title: '5. Acceptable use',
    body: `Don't use the platform to post false or misleading listings, harass another user, attempt to access another account, or interfere with the normal operation of the service. We may suspend or terminate accounts that violate this.`,
  },
  {
    title: '6. Disclaimer and limitation of liability',
    body: `The platform is provided "as is." We do our best to vet vendor accounts before approval, but we don't guarantee the quality, safety, or legality of any vendor's services, and we're not liable for disputes, damages, or losses arising from a booking arranged through the platform, to the fullest extent permitted by law.`,
  },
  {
    title: '7. Changes',
    body: `We may update these terms from time to time. Continued use of the platform after a change means you accept the updated terms.`,
  },
  {
    title: '8. Contact',
    body: `Questions about these terms can be sent to hello@shathaevents.com or through our contact page.`,
  },
];

export default function TermsPage() {
  return (
    <section className="section-ivory">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Terms of Service</h1>
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
