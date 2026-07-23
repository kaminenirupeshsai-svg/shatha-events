'use client';

import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactInputSchema, type ContactInput } from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/reveal';
import { useSubmitContact } from '@/features/contact/hooks';
import { toast } from 'sonner';

const CONTACT_DETAILS = [
  { icon: Mail, label: 'hello@shathaevents.com' },
  { icon: Phone, label: '+1 (555) 010-2938' },
  { icon: MapPin, label: '128 Harbor Row, Suite 4, Portland, OR' },
];

export default function ContactPage() {
  const submitContact = useSubmitContact();

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactInputSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', message: '' },
  });

  const onInvalid = (formErrors: FieldErrors<ContactInput>) => {
    const first = Object.keys(formErrors)[0] as keyof ContactInput | undefined;
    if (first) setFocus(first);
  };

  const onSubmit = handleSubmit((values) => {
    submitContact.mutate(values, {
      onSuccess: () => reset(),
      onError: (err: Error) => toast.error(err.message || 'Could not send your message. Please try again.'),
    });
  }, onInvalid);

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
            {submitContact.isSuccess ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <h2 className="font-display text-xl font-semibold text-ink">Thanks for reaching out</h2>
                <p className="text-sm text-ink-soft">We usually reply within one business day.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1.5 text-sm text-terracotta">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-sm text-terracotta">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    {...register('message')}
                  />
                  {errors.message && (
                    <p id="message-error" className="mt-1.5 text-sm text-terracotta">
                      {errors.message.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" isLoading={submitContact.isPending}>
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
