import type { BookingStatus } from '@app/shared';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Exact mapping from packages/shared/src/design-tokens.ts `statusToneMap`.
// `reviewed` uses a slightly darker amber text (#8C6A22) than the `amber`
// token for AA contrast on amberTint, per the design spec.
const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending: 'bg-slate-tint text-slate',
  reviewed: 'bg-amber-tint text-[#8C6A22] dark:text-amber',
  confirmed: 'bg-emerald-tint text-emerald',
  in_progress: 'bg-teal-tint text-teal',
  completed: 'bg-emerald text-ivory',
  cancelled: 'bg-terracotta-tint text-terracotta',
};

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-wide',
        STATUS_CLASSES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
