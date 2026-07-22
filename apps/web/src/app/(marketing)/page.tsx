import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessagesSquare, Search, Sparkles } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS, ServiceCategorySchema } from '@app/shared';
import { Button } from '@/components/ui/button';
import { HeroSearch } from '@/components/shared/hero-search';
import { Reveal, StaggerItem, StaggerReveal } from '@/components/shared/reveal';
import { CATEGORY_ACCENT, CATEGORY_BLURB, HERO_IMAGE_URL, categoryImageUrl } from '@/lib/category-images';
import { cn } from '@/lib/utils';

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
      <section className="section-ivory overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-24">
          <Reveal>
            <p className="eyebrow mb-4">Event planning, done thoughtfully</p>
            <h1 className="max-w-xl font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
              Plan it once. Celebrate for real.
            </h1>
            <p className="mt-6 max-w-lg text-base text-ink-soft sm:text-lg">
              Shatha Events connects you with vetted decor, catering, photography, venue, and entertainment vendors
              — then coordinates the booking pipeline so your event comes together without the chaos.
            </p>

            <div className="mt-8">
              <HeroSearch />
              <div className="mt-4 flex flex-wrap gap-2">
                {ServiceCategorySchema.options.map((category) => (
                  <Link
                    key={category}
                    href={`/services?category=${category}`}
                    className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-emerald hover:text-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
                  >
                    {SERVICE_CATEGORY_LABELS[category]}
                  </Link>
                ))}
              </div>
            </div>

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
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
              <div className="absolute -left-4 -top-4 h-40 w-40 rounded-[2rem] bg-amber-tint" />
              <div className="absolute -bottom-6 -right-6 h-48 w-48 rotate-6 rounded-[2rem] bg-emerald-tint" />
              <div className="relative h-full w-full overflow-hidden rounded-[2rem] shadow-popover">
                <Image
                  src={HERO_IMAGE_URL}
                  alt="A guest celebrating amid falling confetti at an event Shatha Events helped plan"
                  fill
                  sizes="(min-width: 1024px) 28rem, 90vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent p-6 pt-16">
                  <p className="font-display text-lg font-semibold text-ivory">Every event, fully coordinated</p>
                </div>
              </div>
              <div className="absolute -right-3 -top-3 flex h-16 w-16 rotate-12 items-center justify-center rounded-2xl bg-amber shadow-card">
                <Sparkles className="h-6 w-6 text-ink" aria-hidden="true" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services offered */}
      <section className="section-linen">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Reveal>
            <p className="eyebrow mb-3">What we cover</p>
            <h2 className="max-w-xl font-display text-3xl font-semibold text-ink sm:text-4xl">
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
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src={categoryImageUrl(category, 500)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className={cn('absolute bottom-3 left-3 h-2.5 w-2.5 rounded-full', CATEGORY_ACCENT[category])} />
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
