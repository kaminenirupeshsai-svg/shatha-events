'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SERVICE_CATEGORY_LABELS, type ServiceDto } from '@app/shared';
import { formatPriceRange } from '@/lib/utils';
import { cardHover } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Each category gets a distinct tone from the palette so the placeholder
// blocks read as a coherent set (used in place of real photography).
const CATEGORY_TONE: Record<ServiceDto['category'], string> = {
  decor_styling: 'bg-amber-tint',
  photography_film: 'bg-teal-tint',
  catering_hospitality: 'bg-terracotta-tint',
  venue_logistics: 'bg-emerald-tint',
  entertainment_activities: 'bg-slate-tint',
};

const CATEGORY_ACCENT: Record<ServiceDto['category'], string> = {
  decor_styling: 'bg-amber',
  photography_film: 'bg-teal',
  catering_hospitality: 'bg-terracotta',
  venue_logistics: 'bg-emerald',
  entertainment_activities: 'bg-slate',
};

export function ServiceCard({ service }: { service: ServiceDto }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="rest"
      whileHover={shouldReduceMotion ? undefined : 'hover'}
      animate="rest"
      variants={cardHover}
      className="h-full"
    >
      <Link
        href={`/services/${service.id}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
      >
        <div className={cn('relative h-40 w-full overflow-hidden', CATEGORY_TONE[service.category])}>
          <div className={cn('absolute -bottom-8 -right-8 h-28 w-28 rounded-[2rem] opacity-70', CATEGORY_ACCENT[service.category])} />
          <div className={cn('absolute -top-6 left-6 h-16 w-16 rotate-12 rounded-2xl opacity-40', CATEGORY_ACCENT[service.category])} />
          {!service.isActive && (
            <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 font-label text-[10px] font-semibold uppercase tracking-wide text-ivory">
              Inactive
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <p className="eyebrow">{SERVICE_CATEGORY_LABELS[service.category]}</p>
          <h3 className="font-display text-lg font-semibold text-ink">{service.title}</h3>
          <p className="text-sm font-medium text-emerald">
            {formatPriceRange(service.priceRange.min, service.priceRange.max)}
          </p>
          {service.vendorName && <p className="mt-auto pt-2 text-xs text-ink-soft">By {service.vendorName}</p>}
        </div>
      </Link>
    </motion.div>
  );
}
