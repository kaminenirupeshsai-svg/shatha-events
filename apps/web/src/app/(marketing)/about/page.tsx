import type { Metadata } from 'next';
import { Reveal, StaggerItem, StaggerReveal } from '@/components/shared/reveal';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Shatha Events and how we connect clients with vetted event vendors.',
};

const VALUES = [
  {
    title: 'Vetted, not just listed',
    description: 'Every vendor on Shatha Events is reviewed before they can accept bookings — quality over quantity.',
  },
  {
    title: 'One pipeline, full visibility',
    description: 'Clients, vendors, and our admin team see the same booking status in real time, end to end.',
  },
  {
    title: 'Thoughtful by default',
    description: 'From the first browse to the final confirmation, every interaction is designed to feel calm and clear.',
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="section-ivory">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal>
            <p className="eyebrow mb-4">About Shatha Events</p>
            <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
              We built the booking pipeline events deserve.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-ink-soft">
              Shatha Events started with a simple frustration: planning an event meant juggling spreadsheets, group
              texts, and a dozen half-answered emails. We built a single place where clients, vendors, and planners
              can move a booking from idea to confirmed event without losing track of a single detail.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-linen">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <StaggerReveal className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {VALUES.map((value) => (
              <StaggerItem key={value.title}>
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <h2 className="font-display text-lg font-semibold text-ink">{value.title}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{value.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>
    </>
  );
}
