import Link from 'next/link';
import { ArrowRight, MessagesSquare, Search, Sparkles } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS, ServiceCategorySchema } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Reveal, StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

const CATEGORY_TONE: Record<string, string> = {
  decor_styling: 'bg-amber-tint',
  photography_film: 'bg-teal-tint',
  catering_hospitality: 'bg-terracotta-tint',
  venue_logistics: 'bg-emerald-tint',
  entertainment_activities: 'bg-slate-tint',
};

const CATEGORY_ACCENT: Record<string, string> = {
  decor_styling: 'bg-amber',
  photography_film: 'bg-teal',
  catering_hospitality: 'bg-terracotta',
  venue_logistics: 'bg-emerald',
  entertainment_activities: 'bg-slate',
};

const CATEGORY_BLURB: Record<string, string> = {
  decor_styling: 'Florals, staging, and styling that set the scene.',
  photography_film: 'Photographers and videographers who capture the day.',
  catering_hospitality: 'Menus, bar service, and staff for every guest count.',
  venue_logistics: 'Venues, rentals, and day-of logistics handled.',
  entertainment_activities: 'Music, hosts, and activities that keep it lively.',
};

const STEPS = [
  {
    icon: Search,
    title: 'Browse vetted vendors',
    description: 'Explore decor, catering, photography, venues, and entertainment from vendors we know deliver.',
  },
  {
    icon: MessagesSquare,
    title: 'Submit a booking request',
    description: 'Tell us your event type, date, guest count, and budget — no back-and-forth calls required.',
  },
  {
    icon: Sparkles,
    title: 'We coordinate the rest',
    description: 'Our team reviews, confirms, and keeps you updated in real time until the day of your event.',
  },
];

const STATS = [
  { value: '1,200+', label: 'Events planned' },
  { value: '340+', label: 'Vetted vendors' },
  { value: '98%', label: 'Client satisfaction' },
  { value: '24h', label: 'Average response time' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="section-ivory">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <Reveal>
            <p className="eyebrow mb-4">Event planning, done thoughtfully</p>
            <h1 className="max-w-xl font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              Thoughtfully planned, beautifully executed.
            </h1>
            <p className="mt-6 max-w-lg text-base text-ink-soft sm:text-lg">
              Shatha Events connects you with vetted decor, catering, photography, venue, and entertainment vendors
              — then coordinates the booking pipeline so your event comes together without the chaos.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start planning <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services">Browse services</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute left-0 top-6 h-64 w-64 rounded-[2rem] bg-emerald-tint" />
              <div className="absolute right-4 top-0 h-48 w-48 rotate-6 rounded-[2rem] bg-amber shadow-card" />
              <div className="absolute bottom-0 left-10 h-56 w-56 -rotate-6 rounded-[2rem] bg-emerald shadow-popover" />
              <div className="absolute right-10 bottom-10 h-24 w-24 rotate-12 rounded-2xl bg-amber-tint" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services offered */}
      <section className="section-linen">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Reveal>
            <p className="eyebrow mb-3">What we cover</p>
            <h2 className="max-w-xl font-display text-3xl font-semibold text-ink">
              Five categories, one coordinated experience
            </h2>
          </Reveal>

          <StaggerReveal className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {ServiceCategorySchema.options.map((category) => (
              <StaggerItem key={category}>
                <Link
                  href={`/services?category=${category}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
                >
                  <div className={cn('relative h-28 w-full overflow-hidden', CATEGORY_TONE[category])}>
                    <div className={cn('absolute -bottom-6 -right-6 h-20 w-20 rounded-2xl opacity-70', CATEGORY_ACCENT[category])} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="font-display text-base font-semibold text-ink">
                      {SERVICE_CATEGORY_LABELS[category]}
                    </h3>
                    <p className="text-sm text-ink-soft">{CATEGORY_BLURB[category]}</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="section-ivory">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Reveal>
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="max-w-xl font-display text-3xl font-semibold text-ink">Three steps to a booked event</h2>
          </Reveal>

          <StaggerReveal className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <StaggerItem key={step.title}>
                  <div className="flex flex-col gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-tint">
                      <Icon className="h-5 w-5 text-emerald" aria-hidden="true" />
                    </span>
                    <p className="font-label text-xs font-semibold uppercase tracking-wide text-amber">
                      Step {idx + 1}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-ink">{step.title}</h3>
                    <p className="text-sm text-ink-soft">{step.description}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-emerald-deep">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <StaggerReveal className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <StaggerItem key={stat.label}>
                <p className="font-display text-3xl font-semibold text-ivory sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-ivory/70">{stat.label}</p>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* CTA band */}
      <section className="section-linen">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Ready to plan something beautiful?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-soft">
              Create an account and submit your first booking request in minutes — our team takes it from there.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
