import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Shatha Events home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald">
        <span className="h-3.5 w-3.5 rounded-full bg-amber" />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-ivory bg-amber-tint" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">Shatha Events</span>
    </Link>
  );
}
