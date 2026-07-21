'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useChartTokens } from '@/lib/chart-colors';
import { ChartTooltipRow, ChartTooltipShell } from './chart-tooltip';
import { EmptyState } from '@/components/ui/empty-state';

export interface WeekDatum {
  weekLabel: string;
  count: number;
}

export function BookingsOverTimeChart({ data }: { data: WeekDatum[] }) {
  const tokens = useChartTokens();
  const hasData = data.some((d) => d.count > 0);

  function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
    if (!active || !payload || payload.length === 0) return null;
    const datum = payload[0]?.payload as WeekDatum | undefined;
    if (!datum) return null;
    return (
      <ChartTooltipShell>
        <p className="mb-1.5 text-xs text-ink-soft">{datum.weekLabel}</p>
        <ChartTooltipRow colorHex={tokens.emerald} label="Bookings" value={String(datum.count)} />
      </ChartTooltipShell>
    );
  }

  if (!hasData) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Not enough data yet"
        description="Booking volume over time will appear here once requests start coming in."
        className="h-full"
      />
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tokens.emerald} stopOpacity={0.18} />
              <stop offset="100%" stopColor={tokens.emerald} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={tokens.line} strokeDasharray="0" />
          <XAxis
            dataKey="weekLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tokens.inkSoft, fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: tokens.inkSoft, fontSize: 12 }}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: tokens.line, strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={tokens.emerald}
            strokeWidth={2}
            fill="url(#bookingsFill)"
            dot={false}
            activeDot={{ r: 4, fill: tokens.emerald, stroke: tokens.surface, strokeWidth: 2 }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
