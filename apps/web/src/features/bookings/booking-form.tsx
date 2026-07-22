'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Cake, Briefcase, PartyPopper, Heart } from 'lucide-react';
import {
  CreateBookingInputSchema,
  SERVICE_CATEGORY_LABELS,
  type CreateBookingInput,
  type EventType,
} from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useServices } from '@/features/services/hooks';

const EVENT_TYPES: { value: EventType; label: string; icon: typeof Heart }[] = [
  { value: 'wedding', label: 'Wedding', icon: Heart },
  { value: 'corporate', label: 'Corporate', icon: Briefcase },
  { value: 'birthday', label: 'Birthday', icon: Cake },
  { value: 'social', label: 'Social', icon: PartyPopper },
];

export interface BookingFormProps {
  onSubmit: (values: CreateBookingInput) => void;
  isSubmitting?: boolean;
  /** Pre-checks this service's chip once the services list loads (e.g. arriving from a service detail page). */
  preselectedServiceId?: string;
}

export function BookingForm({ onSubmit, isSubmitting, preselectedServiceId }: BookingFormProps) {
  const { data: servicesPage, isLoading: servicesLoading } = useServices({ limit: 100, sort: 'newest' });
  const services = useMemo(() => servicesPage?.items ?? [], [servicesPage]);
  const appliedPreselect = useRef(false);

  const {
    control,
    register,
    handleSubmit,
    setFocus,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(CreateBookingInputSchema),
    mode: 'onBlur',
    defaultValues: {
      eventType: 'wedding',
      eventDate: undefined,
      guestCount: undefined,
      services: [],
      budget: undefined,
      message: '',
    },
  });

  const watchedServices = watch('services');
  const selectedServices = useMemo(() => watchedServices ?? [], [watchedServices]);
  const selectedIds = useMemo(() => new Set(selectedServices.map((s) => s.serviceId)), [selectedServices]);

  useEffect(() => {
    if (appliedPreselect.current || !preselectedServiceId || services.length === 0) return;
    const match = services.find((s) => s.id === preselectedServiceId);
    if (match) {
      setValue('services', [{ serviceId: match.id }], { shouldValidate: true });
      appliedPreselect.current = true;
    }
  }, [preselectedServiceId, services, setValue]);

  function toggleService(serviceId: string) {
    if (selectedIds.has(serviceId)) {
      setValue(
        'services',
        selectedServices.filter((s) => s.serviceId !== serviceId),
        { shouldValidate: true },
      );
    } else {
      setValue('services', [...selectedServices, { serviceId }], { shouldValidate: true });
    }
  }

  const onInvalid = (formErrors: FieldErrors<CreateBookingInput>) => {
    const first = Object.keys(formErrors)[0];
    if (first === 'eventType') return;
    if (first === 'services') return;
    if (first) setFocus(first as keyof CreateBookingInput);
  };

  const submit = handleSubmit((values) => onSubmit(values), onInvalid);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div>
        <Label htmlFor="eventType-group">Event type</Label>
        <Controller
          control={control}
          name="eventType"
          render={({ field }) => (
            <div id="eventType-group" role="radiogroup" aria-label="Event type" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EVENT_TYPES.map((type) => {
                const Icon = type.icon;
                const selected = field.value === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                      selected ? 'border-emerald bg-emerald text-ivory' : 'border-line bg-surface text-ink hover:bg-linen',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="eventDate">Event date</Label>
          <Input
            id="eventDate"
            type="date"
            invalid={Boolean(errors.eventDate)}
            {...register('eventDate')}
          />
          {errors.eventDate && <p className="mt-1.5 text-sm text-terracotta">{errors.eventDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="guestCount">Guest count</Label>
          <Input
            id="guestCount"
            type="number"
            min={1}
            invalid={Boolean(errors.guestCount)}
            {...register('guestCount', {
              setValueAs: (v) => (v === '' ? undefined : Number(v)),
            })}
          />
          {errors.guestCount && <p className="mt-1.5 text-sm text-terracotta">{errors.guestCount.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="services-group">Services you&apos;re interested in</Label>
        {servicesLoading ? (
          <p className="text-sm text-ink-soft">Loading services…</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-terracotta">
            No services are listed yet, so a booking request can&apos;t be submitted right now — please check back
            once vendors have added their services.
          </p>
        ) : (
          <div id="services-group" className="flex flex-wrap gap-2">
            {services.map((service) => {
              const selected = selectedIds.has(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
                    selected ? 'border-amber bg-amber-tint text-ink' : 'border-line bg-surface text-ink-soft hover:bg-linen',
                  )}
                >
                  {service.title}
                  <span className="ml-1.5 text-xs text-ink-soft">· {SERVICE_CATEGORY_LABELS[service.category]}</span>
                </button>
              );
            })}
          </div>
        )}
        {errors.services && <p className="mt-1.5 text-sm text-terracotta">{errors.services.message}</p>}
      </div>

      <div>
        <Label htmlFor="budget">Budget (USD, optional)</Label>
        <Input
          id="budget"
          type="number"
          min={0}
          invalid={Boolean(errors.budget)}
          {...register('budget', {
            setValueAs: (v) => (v === '' ? undefined : Number(v)),
          })}
        />
        {errors.budget && <p className="mt-1.5 text-sm text-terracotta">{errors.budget.message}</p>}
      </div>

      <div>
        <Label htmlFor="message">Tell us about your event (optional)</Label>
        <Textarea id="message" invalid={Boolean(errors.message)} {...register('message')} />
        {errors.message && <p className="mt-1.5 text-sm text-terracotta">{errors.message.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={!servicesLoading && services.length === 0}
      >
        Submit booking request
      </Button>
    </form>
  );
}
