'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SERVICE_CATEGORY_LABELS, type ServiceDto } from '@app/shared';
import { formatPriceRange } from '@/lib/utils';
import { cardHover } from '@/lib/motion';
import { CATEGORY_ACCENT, categoryImageUrl } from '@/lib/category-images';
import { cn } from '@/lib/utils';

export function ServiceCard({ service }: { service: ServiceDto }) {
  const shouldReduceMotion = useReducedMotion();
  const imageUrl = service.images[0] ?? categoryImageUrl(service.category, 500);

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
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
          <span className={cn('absolute bottom-3 left-3 h-2.5 w-2.5 rounded-full', CATEGORY_ACCENT[service.category])} />
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
