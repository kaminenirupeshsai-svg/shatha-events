'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { colors, darkColors, statusToneMap, type BookingStatus } from '@app/shared';

/**
 * Charts (Recharts/SVG) need real color strings, not Tailwind classes, so
 * this reads directly from the same source of truth as everything else —
 * packages/shared/src/design-tokens.ts — rather than hand-duplicating hex
 * values. Picks the light or dark token set based on the resolved theme.
 */
export function useChartTokens() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Default to light tokens until mounted to avoid a hydration flash.
  return mounted && resolvedTheme === 'dark' ? darkColors : colors;
}

export function useStatusColor(status: BookingStatus): string {
  const tokens = useChartTokens();
  const tone = statusToneMap[status];
  return tokens[tone.fg as keyof typeof tokens];
}
