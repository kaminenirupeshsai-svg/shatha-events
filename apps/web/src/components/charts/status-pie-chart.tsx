'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import type { BookingStatus, colors as ColorTokens } from '@app/shared';
import { useChartTokens, useStatusColor } from '@/lib/chart-colors';
import { ChartTooltipRow, ChartTooltipShell } from './chart-tooltip';
import { EmptyState } from '@/components/ui/empty-state';
import { PieChart as PieChartIcon } from 'lucide-react';

export interface StatusDatum {
  status: BookingStatus;
  count: number;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Fixed brand mapping from status -> design token (matches statusToneMap's
// `fg` tone in packages/shared/src/design-tokens.ts).
const STATUS_TOKEN_KEY: Record<BookingStatus, keyof typeof ColorTokens> = {
  pending: 'slate',
  reviewed: 'amber',
  confirmed: 'emerald',
  in_progress: 'teal',
  completed: 'emerald',
  cancelled: 'terracotta',
};

const STATUS_ORDER: BookingStatus[] = ['pending', 'reviewed', 'confirmed', 'in_progress', 'completed', 'cancelled'];

function Swatch({ status }: { status: BookingStatus }) {
  const color = useStatusColor(status);
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />;
}

function LegendRow({ status, count }: { status: BookingStatus; count: number }) {
  return (
    <li className="flex items-center gap-2 text-sm text-ink-soft">
      <Swatch status={status} />
      <span className="text-ink">{STATUS_LABELS[status]}</span>
      <span className="ml-auto font-medium text-ink">{count}</span>
    </li>
  );
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const datum = entry?.payload as StatusDatum | undefined;
  if (!datum) return null;
  return (
    <ChartTooltipShell>
      <ChartTooltipRow colorHex={String(entry?.color)} label={STATUS_LABELS[datum.status]} value={String(datum.count)} />
    </ChartTooltipShell>
  );
}

export function StatusPieChart({ data }: { data: StatusDatum[] }) {
  const tokens = useChartTokens();
  const orderedData = STATUS_ORDER.map((status) => data.find((d) => d.status === status) ?? { status, count: 0 }).filter(
    (d) => d.count > 0,
  );
  const total = orderedData.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="No bookings yet"
        description="Once bookings come in, their status breakdown will appear here."
        className="h-full"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={orderedData}
              dataKey="count"
              nameKey="status"
              innerRadius={64}
              outerRadius={96}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              isAnimationActive
            >
              {orderedData.map((d) => (
                <Cell key={d.status} fill={tokens[STATUS_TOKEN_KEY[d.status]]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold text-ink">{total}</span>
          <span className="text-xs text-ink-soft">bookings</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {orderedData.map((d) => (
          <LegendRow key={d.status} status={d.status} count={d.count} />
        ))}
      </ul>
    </div>
  );
}
