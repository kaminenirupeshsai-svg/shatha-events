'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/reveal';
import { toast } from 'sonner';

const CONTACT_DETAILS = [
  { icon: Mail, label: 'hello@shathaevents.com' },
  { icon: Phone, label: '+1 (555) 010-2938' },
  { icon: MapPin, label: '128 Harbor Row, Suite 4, Portland, OR' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Message sent — we'll get back to you within a business day.");
  }

  return (
    <section className="section-ivory">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow mb-4">Get in touch</p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Have a question before you book?
          </h1>
          <p className="mt-4 max-w-md text-ink-soft">
            Whether you&apos;re planning your first event or you&apos;re a vendor curious about joining, our team is happy to
            help.
          </p>
          <ul className="mt-8 space-y-4">
            {CONTACT_DETAILS.map((detail) => {
              const Icon = detail.icon;
              return (
                <li key={detail.label} className="flex items-center gap-3 text-sm text-ink-soft">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-tint">
                    <Icon className="h-4 w-4 text-emerald" aria-hidden="true" />
                  </span>
                  {detail.label}
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <h2 className="font-display text-xl font-semibold text-ink">Thanks for reaching out</h2>
                <p className="text-sm text-ink-soft">We usually reply within one business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" required />
                </div>
                <Button type="submit" className="w-full">
                  Send message
                </Button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
