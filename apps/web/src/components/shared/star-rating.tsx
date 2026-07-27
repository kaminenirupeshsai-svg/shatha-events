'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_CLASSES = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' } as const;

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

/** Read-only display when `onChange` is omitted; an interactive 1-5 picker when it's provided. */
export function StarRating({ value, onChange, size = 'md', className }: StarRatingProps) {
  const readOnly = !onChange;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `${value} out of 5 stars` : 'Rate from 1 to 5 stars'}
    >
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <Star
            className={cn(SIZE_CLASSES[size], filled ? 'fill-amber text-amber' : 'fill-none text-ink-soft/30')}
            aria-hidden="true"
          />
        );
        if (readOnly) return <span key={star}>{icon}</span>;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star)}
            className="rounded transition-colors hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
